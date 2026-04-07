"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { readStoredToken, readStoredUser } from "@/shared/auth/storage";
import { selectAuth, setAuth } from "@/store/auth/authSlice";

export default function AuthSessionBootstrap() {
  const dispatch = useDispatch();
  const { token, user } = useSelector(selectAuth);

  useEffect(() => {
    if (token || user) {
      return;
    }

    const storedToken = readStoredToken();
    const storedUser = readStoredUser();

    if (!storedToken) {
      return;
    }

    dispatch(
      setAuth({
        access_token: storedToken,
        user: storedUser ?? undefined,
      }),
    );
  }, [dispatch, token, user]);

  return null;
}
