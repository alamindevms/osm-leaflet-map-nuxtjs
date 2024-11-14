import crypto from "crypto";

export default defineEventHandler(async (event) => {
  // Retrieve the request headers
  const headers = getRequestHeaders(event);
  const param = getQuery(event);
  console.log("param", param);

  // Log the headers for debugging purposes
  console.log({ headers });

  // Combine relevant header information to create a unique string
  const userData = [
    headers["user-agent"], // User-Agent of the browser
    headers["x-forwarded-for"], // IP address
    headers["sec-ch-ua"], // Browser information (e.g., platform, brand)
    headers["accept-language"], // Language preference
    param.user_id,
  ].join("|"); // Join with a delimiter to create a unique string

  // Create an MD5 hash of the combined string
  const hash = crypto.createHash("md5");
  hash.update(userData); // Use combined header data to create the hash
  const digest = hash.digest("hex");

  console.log("cookies login-verify", getCookie(event, "login-verify"));
  console.log("cookies", getCookie(event, "user_id"));

  if (param.user_id) {
    setCookie(event, "user_id", param?.user_id as string, {
      httpOnly: true,
      secure: true,
    });
  }

  const cookies = parseCookies(event);

  console.log("cookies -----> ", cookies);

  // Return the response with the unique MD5 hash and the headers
  return { message: "Hello from the API", headers, digest, params: param };
});
