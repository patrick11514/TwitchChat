import { browser } from '$app/environment';
import Swal, { type SweetAlertOptions } from 'sweetalert2';
import z from 'zod';

export const SwalAlert = async (data: SweetAlertOptions) => {
    if (!browser) {
        return {
            isConfirmed: false
        };
    }

    return Swal.fire({
        toast: true,
        position: 'top-end',
        timer: 2000,
        timerProgressBar: true,
        showCancelButton: false,
        showConfirmButton: false,
        ...data
    });
};

export const DEFAULT_ASSETS = {
    TWITCH_DEFAULT_BADGE: 'https://assets.twitch.tv/assets/dark-40f6c299eb07b670b88d.svg'
} as const;

export const customFetch = async <$ReturnType>(url: string, options: RequestInit, schema: z.ZodType<$ReturnType>): Promise<$ReturnType | z.ZodError<$ReturnType> | null> => {
    const response = await fetch(url, options);

    if (!response.ok) {
        return null;
    }
    try {
        const json = await response.json();
        const data = schema.safeParse(json);

        if (!data.success) {
            return data.error;
        }

        return data.data;
    } catch (_) {
        return null;
    }
};
