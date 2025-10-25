import { PageProps } from "$fresh/server.ts";

export default function Login(_props: PageProps) {
  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 class="text-2xl font-bold text-center mb-6">Billing System Login</h1>
        <form method="POST" action="/api/auth/login" id="loginForm">
          <div class="mb-4">
            <label for="username" class="block text-sm font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="mb-6">
            <label for="password" class="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
          <div id="error" class="mt-4 text-red-500 text-sm hidden"></div>
        </form>
        <div class="mt-4 text-sm text-gray-600">
          <p>Demo credentials:</p>
          <p>Admin: admin / admin123</p>
          <p>Sales: ventas / sales123</p>
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const username = formData.get('username');
              const password = formData.get('password');
              
              try {
                const response = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                  window.location.href = '/';
                } else {
                  document.getElementById('error').textContent = data.error || 'Login failed';
                  document.getElementById('error').classList.remove('hidden');
                }
              } catch (error) {
                document.getElementById('error').textContent = 'An error occurred';
                document.getElementById('error').classList.remove('hidden');
              }
            });
          `,
        }}
      />
    </div>
  );
}
