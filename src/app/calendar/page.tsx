import { redirect } from "next/navigation";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ age?: string; day1?: string; cl?: string; bd?: string }>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  if (params.age) q.set("age", params.age);
  if (params.day1) q.set("day1", params.day1);
  if (params.cl) q.set("cl", params.cl);
  if (params.bd) q.set("bd", params.bd);
  redirect(`/navigate?${q.toString()}`);
}
