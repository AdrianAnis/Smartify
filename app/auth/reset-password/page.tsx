import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage(
  props: PageProps<"/auth/reset-password">,
) {
  const { token } = await props.searchParams;
  return <ResetPasswordForm token={typeof token === "string" ? token : ""} />;
}
