import { login } from "./actions";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
  }>;
}) {

  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center">

      <div className="w-96 p-6 rounded-lg shadow bg-white">

        <h1 className="text-2xl font-bold mb-5">
          Loginn
        </h1>

        {error && (
          <div className="bg-red-100 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form action={login}>

          <input
            type="email"
            name="email"
            required
            placeholder="Email"
            className="border w-full p-2 rounded mb-4"
          />

          <input
            type="password"
            name="password"
            required
            placeholder="Password"
            className="border w-full p-2 rounded mb-4"
          />

          <button
            className="bg-blue-600 text-white w-full p-2 rounded"
          >
            Logi
          </button>

        </form>

        <div className="mt-4 text-center">
          <a href="/forgot-password" className="text-blue-600 text-sm">
            Lupa password?
          </a>
        </div>

      </div>

    </div>
  )
}