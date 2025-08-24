import { vi } from "vitest";

export const mockSendVerificationEmail = vi
    .fn()
    .mockImplementation((email: string, token: string) => {
        console.log(`Mock verfication email sent to ${email}`);
        console.log(`Mock verfication token ${token}`);
        return Promise.resolve();
    });
