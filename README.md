# Node.js Elective - Mandatory 2

A simple project that demonstrates user accounts, authorizing pages, and nodemailer for password reset.

## Demo

There is an administrator account for demonstration purpose:

- Username: `admin`
- Password: `administrator`

## Configuration

To run this application you need to have a PostgreSQL database.
Fill in the fields from `.env.template` file and rename it to `.env`

## Pages

- `/` - index page, only authorized access
- `/login` - login page
- `/logout` - logout page
- `/register` - registration page
- `/forgotPassword` - request password reset page
- `/confirmResetPassword` - reset password page
- `/users` - index page, only admin accounts access
