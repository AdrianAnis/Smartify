import LoginForm from "./LoginForm";

function getSafeRedirect(value: string | string[] | undefined) {
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
  ) {
    return value;
  }
  return "/dashboard";
}

export default async function LoginPage(props: PageProps<"/auth/login">) {
  const { redirect } = await props.searchParams;
  return <LoginForm redirectTo={getSafeRedirect(redirect)} />;
}
