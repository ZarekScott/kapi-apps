export const config = { path: "/.netlify/functions/discord-invite" };
export default async (req, ctx) => {
  const url = process.env.DISCORD_INVITE_URL || "#";
  return new Response(null, { status: 302, headers: { Location: url } });
};
