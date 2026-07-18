import { forgotPassword } from "../login/actions";

export default async function ForgotPassword({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
}) {

  const { success, error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center">

      <div className="w-96 p-6 rounded-lg shadow bg-white">

        <h1 className="text-2xl font-bold mb-5">
          Reset Password
        </h1>

        {success && (
          <div className="bg-green-100 p-3 rounded mb-4">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-100 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form action={forgotPassword}>

          <input
            type="email"
            name="email"
            required
            placeholder="Email"
            className="border w-full p-2 rounded mb-4"
          />

          <button
            className="bg-blue-600 text-white w-full p-2 rounded"
          >
            Kirim Email
          </button>

        </form>

      </div>

    </div>
  )
}