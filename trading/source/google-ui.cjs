'use strict';
const access=`<section class="z-google-access" data-google-access hidden aria-labelledby="google-access-heading"><h2 id="google-access-heading">Your Google account. Your learning desk.</h2><div data-google-button></div><p data-google-status role="status"></p><button type="button" class="action secondary" data-google-retry hidden>Retry Google sign-in</button><a class="z-privacy-link" href="/trading/privacy">How sign-in data is used</a><p class="z-signin-divider">Or use your Trade Zuko password</p></section>`;
function enhance(html){
  return html
    .replace('<form data-login-form>',access+'<form data-login-form>')
    .replace('A focused space for understanding markets. Enter the learner password supplied by Aman, or use your separate owner access.','A focused space for understanding markets. Sign in with Google when available, use a learner password, or browse the public library without an account.')
    .replace('The public study website is open; this app requires a password.','The public study website is open to everyone. Google sign-in grants learner access only; owner controls always require Aman’s separate password.')
    .replace('This signs learners out on their next access check. Share only the new learner password.','This signs learners out on their next access check. Share only the new learner password. Google users can sign in again without the shared password.')
    .replace('Every protected page request checks the current password version.','Every protected page request checks the current access version. Google sign-in is public learner access, not paid-course enrollment.');
}
module.exports={enhance};
