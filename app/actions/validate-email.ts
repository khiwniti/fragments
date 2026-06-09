'use server'

export async function validateEmail(
  email: string,
  _password: string
): Promise<boolean> {
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
