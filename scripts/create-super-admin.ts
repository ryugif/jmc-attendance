import "dotenv/config";

import { auth } from "../lib/auth";

async function main() {
    const email = process.env.SUPER_ADMIN_EMAIL ?? "superadmin@example.com";
    const name = process.env.SUPER_ADMIN_NAME ?? "Super Admin";
    const username = process.env.SUPER_ADMIN_USERNAME ?? "superadmin";
    const password = process.env.SUPER_ADMIN_PASSWORD ?? "SuperAdmin123!";

    try {
        const user = await auth.api.createUser({
            body: {
                email,
                name,
                password,
                role: "admin",
                data: {
                    username,
                },
            },
        });

        console.log("Super admin created successfully.");
        console.log(JSON.stringify({
            email: user.user.email,
            username,
            role: user.user.role ?? "admin",
        }, null, 2));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        if (message.toLowerCase().includes("already exists") || message.toLowerCase().includes("user already exists")) {
            console.log(`Super admin already exists for ${email}.`);
            return;
        }

        console.error("Failed to create super admin.");
        console.error(message);
        process.exitCode = 1;
    }
}

void main();
