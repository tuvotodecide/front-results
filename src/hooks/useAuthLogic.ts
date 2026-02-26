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
            .email("Correo electrónico inválido")
            .required("El correo es obligatorio"),
        password: Yup.string()
            .min(8, "Mínimo 8 caracteres")
            .required("La contraseña es obligatoria"),
    });

    const onSubmit = async (values: typeof initialValues) => {
        try {
            const res = await loginUser(values).unwrap();
            const isApproved = Boolean(res.active);
            const role = mapBackendRole(res.role);

            if (!isApproved) {
                dispatch(
                    setAuth({
                        user: {
                            ...((res.user as any) || {}),
                            sub: res.user?.sub || "unknown",
                            email: values.email,
                            role,
                            active: false,
                            status: "PENDING",
                        } as UserProfile,
                    })
                );
                navigate("/pendiente", { replace: true });
                return;
            }

            let profile: any = null;
            try {
                profile = await triggerProfile().unwrap();
            } catch {
                profile = null;
            }

            const userProfile: UserProfile = (res.user as UserProfile) || {
                sub: (profile?.id ?? profile?.sub ?? "unknown") as string,
                email: values.email,
                name: (profile?.name ?? "Usuario") as string,
                role,
                active: true,
                departmentId: profile?.votingDepartmentId,
                municipalityId: profile?.votingMunicipalityId,
                status: "ACTIVE" as const,
            };

            dispatch(setAuth({ user: userProfile }));
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
                navigate("/pendiente", { replace: true });
                return;
            }

            if (
                msgStr.includes("inactivo") ||
                msgStr.includes("no está activo") ||
                msgStr.includes("usuario inactivo")
            ) {
                storageService.setItem("pendingReason", "SUPERADMIN_APPROVAL");
                navigate("/pendiente", { replace: true });
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
