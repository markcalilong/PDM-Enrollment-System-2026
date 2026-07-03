import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

interface RegisterForm {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export function RegisterPage() {
  const { register: registerUser, error, loading } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>();

  return (
    <form onSubmit={handleSubmit((data) => registerUser(data))} className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-1 text-sm text-gray-500">Get started with your enrollment.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          placeholder="Juan"
          error={errors.first_name?.message}
          {...register("first_name", { required: "Required" })}
        />
        <Input
          label="Last Name"
          placeholder="Dela Cruz"
          error={errors.last_name?.message}
          {...register("last_name", { required: "Required" })}
        />
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email", { required: "Email is required" })}
      />

      <Input
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        error={errors.password?.message}
        {...register("password", {
          required: "Password is required",
          minLength: { value: 8, message: "At least 8 characters" },
        })}
      />

      <Button type="submit" loading={loading} className="w-full">
        Create Account
      </Button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
          Sign In
        </Link>
      </p>
    </form>
  );
}
