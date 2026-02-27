import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import * as Yup from "yup";
import { selectAuth, setAuth } from "../store/auth/authSlice";
import {
    useLoginUserMutation,
    useLazyGetProfileQuery,
} from "../store/auth/authEndpoints";
import { ModalState, UserProfile } from "../types";
import { getRoleConfig } from "../config/rolePermissions";
import { storageService } from "../services/storage.service";

export const useAuthLogic = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector(selectAuth);

    const [loginUser, { isLoading: loggingIn }] = useLoginUserMutation();
    const [triggerProfile] = useLazyGetProfileQuery();

    const [modal, setModal] = useState<ModalState>({
        open: false,
        title: "",
        message: "",
        kind: "info",
    });

    const initialValues = { email: "", password: "" };

    const closeModal = () => setModal((m) => ({ ...m, open: false }));

    const openModal = (payload: Omit<ModalState, "open">) =>
        setModal({ open: true, ...payload });

    const mapBackendRole = (
        role: string,
    ): "MAYOR" | "GOVERNOR" | "PUBLIC" | "SUPERADMIN" => {
        const r = String(role || "").toUpperCase();
        if (r === "MAYOR" || r === "ALCALDE") return "MAYOR";
        if (r === "GOVERNOR" || r === "GOBERNADOR") return "GOVERNOR";
        if (r === "SUPERADMIN" || r === "ADMIN" || r === "ADMINISTRADOR") return "SUPERADMIN";
        return "PUBLIC";
    };

    useEffect(() => {
        if (user && location.pathname === "/login") {
            const status = user.status ?? (user.active ? "ACTIVE" : "PENDING");

            if (status === "PENDING") {
                navigate("/pendiente", { replace: true });
                return;
            }

            if (status === "REJECTED" || status === "INACTIVE") {
                navigate("/rechazado", { replace: true });
                return;
            }

            const from = (location.state as any)?.from as string | undefined;
            if (from && from !== "/login") {
                navigate(from, { replace: true });
                return;
            }

            const config = getRoleConfig(user.role);
            navigate(config.homePath(user), { replace: true });
        }
    }, [user, navigate, location]);

    const validationSchema = Yup.object({
        email: Yup.string()
            .required("El usuario o correo es obligatorio"),
        password: Yup.string()
            .min(4, "Mínimo 4 caracteres")
            .required("La contraseña es obligatoria"),
    });

    const onSubmit = async (values: typeof initialValues) => {
        try {
            const res = await loginUser(values).unwrap();

            // 1. Robust extraction from login response
            const rawData = (res as any).data || res;
            const token = rawData.accessToken || rawData.access_token || rawData.token || (res as any).accessToken || (res as any).token;
            const role = mapBackendRole(rawData.role || rawData.user?.role);

            // Assume active if login was successful, unless explicitly false
            const isActive = rawData.active !== false && rawData.isApproved !== false && (rawData.user?.active !== false);

            if (!isActive && role !== "SUPERADMIN") {
                dispatch(
                    setAuth({
                        user: {
                            ...((rawData.user as any) || {}),
                            sub: rawData.user?.sub || rawData.user?.id || rawData.user?._id || rawData.id || "unknown",
                            email: values.email,
                            role,
                            active: false,
                            status: "PENDING",
                        } as UserProfile,
                        accessToken: token
                    })
                );
                navigate("/pendiente", { replace: true });
                return;
            }

            // 1) Petición de Login para obtener el Token
            // Guarda el token primero para habilitar el Bearer en /profile
            dispatch(setAuth({
                accessToken: token,
                token: token
            }));

            // 2) Petición de Perfil (Profile) inmediata
            let profile: any = null;
            try {
                const profileRes = await triggerProfile().unwrap();
                profile = (profileRes as any).data || profileRes;
            } catch (e) {
                console.error("Profile fetch failed, continuing with fallback", e);
            }

            // 3) Construcción del Usuario Final (Mismo patrón que el sistema que funciona)
            const finalUser: UserProfile = {
                ...(rawData.user || {}),
                ...(profile || {}),
                sub: String(profile?.id ?? profile?.sub ?? profile?._id ?? rawData.user?.id ?? rawData.id ?? "unknown"),
                email: values.email || profile?.email || rawData.user?.email || rawData.email,
                name: (profile?.name ?? profile?.fullName ?? rawData.user?.name ?? "Usuario") as string,
                role,
                active: true,
                status: "ACTIVE" as const,
                departmentId: profile?.votingDepartmentId || profile?.departmentId || rawData.user?.votingDepartmentId || rawData.user?.departmentId || rawData.departmentId || rawData.votingDepartmentId,
                municipalityId: profile?.votingMunicipalityId || profile?.municipalityId || rawData.user?.votingMunicipalityId || rawData.user?.municipalityId || rawData.municipalityId || rawData.votingMunicipalityId,
            };

            // 4) Despacho final completo
            dispatch(setAuth({
                user: finalUser,
                accessToken: token,
                token: token
            }));

        } catch (error: any) {
            const msg =
                error?.data?.message || error?.message || "No se pudo iniciar sesión";
            const msgStr = typeof msg === "string" ? msg.toLowerCase() : "";

            storageService.setItem("pendingEmail", values.email);

            if (
                msgStr.includes("no ha sido verificado") ||
                msgStr.includes("no verificado")
            ) {
                storageService.setItem("pendingReason", "VERIFY_EMAIL");
                openModal({
                    kind: "error",
                    title: "No se pudo iniciar sesión",
                    message: "Te enviamos un enlace de verificación a tu correo. Verifica tu bandeja de entrada.",
                });
                return;
            }

            if (
                msgStr.includes("inactivo") ||
                msgStr.includes("no está activo") ||
                msgStr.includes("usuario inactivo") ||
                msgStr.includes("pendiente de aprobación")
            ) {
                storageService.setItem("pendingReason", "SUPERADMIN_APPROVAL");
                openModal({
                    kind: "error",
                    title: "Acceso pendiente",
                    message: "Un Superadmin debe aprobar tu acceso para habilitar el sistema.",
                });
                return;
            }

            const title = "No se pudo iniciar sesión";
            let message =
                typeof msg === "string"
                    ? msg
                    : "Credenciales inválidas o error del servidor.";

            if (message.trim().toLowerCase() === title.trim().toLowerCase()) {
                message = "Verifica tu correo y contraseña e inténtalo nuevamente.";
            }

            openModal({ kind: "error", title, message });
        }
    };

    return {
        initialValues,
        validationSchema,
        onSubmit,
        loggingIn,
        modal,
        closeModal,
    };
};
