import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const signUpSchema = z.object({

    email: z
        .string()
        .email("Please enter a valid email address"),

    password: z
        .string()
        .min(8, "Password should be at least 8 characters"),
});

function Login() {

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(signUpSchema),
    });

    const submittedData = (data) => {
        console.log("Submitted Data:", data);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">

            <div className="card w-full max-w-md bg-base-100 shadow-2xl">

                <div className="card-body">

                    <h2 className="text-3xl font-bold text-center mb-2">
                        Create Account
                    </h2>

                    <p className="text-center text-base-content/60 mb-6">
                        Sign up to start coding
                    </p>

                    <form
                        onSubmit={handleSubmit(submittedData)}
                        className="flex flex-col gap-4"
                    >

                        {/* Email */}
                        <div>
                            <label className="label">
                                <span className="label-text font-semibold">
                                    Email
                                </span>
                            </label>

                            <input
                                type="email"
                                placeholder="Enter your email"
                                className={`input input-bordered w-full ${
                                    errors.email
                                        ? "input-error"
                                        : ""
                                }`}
                                {...register("email")}
                            />

                            {errors.email && (
                                <p className="text-error text-sm mt-1">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="label">
                                <span className="label-text font-semibold">
                                    Password
                                </span>
                            </label>

                            <input
                                type="password"
                                placeholder="Enter your password"
                                className={`input input-bordered w-full ${
                                    errors.password
                                        ? "input-error"
                                        : ""
                                }`}
                                {...register("password")}
                            />

                            {errors.password && (
                                <p className="text-error text-sm mt-1">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="btn btn-primary w-full mt-3"
                        >
                            Log In
                        </button>

                    </form>

                </div>
            </div>
        </div>
    );
}

export default Login;