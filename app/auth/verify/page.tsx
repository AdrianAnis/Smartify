import VerifyForm from "./VerifyForm";

export default async function VerifyPage(props: PageProps<"/auth/verify">) {
  const { email } = await props.searchParams;
  return <VerifyForm emailParam={typeof email === "string" ? email : ""} />;
}
