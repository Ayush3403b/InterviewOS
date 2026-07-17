export const VerifyEmailTemplate = (
  verificationLink: string
) => {
  return `
<!DOCTYPE html>
<html>

<head>
<meta charset="UTF-8" />

<style>

body{
font-family:Arial,sans-serif;
background:#f4f6f8;
padding:40px;
}

.container{
max-width:600px;
margin:auto;
background:#ffffff;
padding:40px;
border-radius:10px;
}

.button{
display:inline-block;
margin-top:25px;
padding:14px 26px;
background:#2563eb;
color:#ffffff !important;
text-decoration:none;
border-radius:8px;
font-weight:bold;
}

.footer{
margin-top:30px;
font-size:13px;
color:#666;
}

</style>

</head>

<body>

<div class="container">

<h2>Verify your InterviewOS account</h2>

<p>
Thanks for registering with
<strong>InterviewOS</strong>.
</p>

<p>
Please verify your email by clicking
the button below.
</p>

<a
href="${verificationLink}"
class="button"
>
Verify Email
</a>

<p class="footer">

If you didn't create an account,
please ignore this email.

</p>

</div>

</body>

</html>
`;
};