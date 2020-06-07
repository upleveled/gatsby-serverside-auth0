# Gatsby + Server-side Auth0 on Heroku

A starter template for server-side authentication of Gatsby static-site content with Node.js and Express using Auth0 (deployable to Heroku).

This does not use any client-only routes in Gatsby.

Based off of [Auth0 + Node.js on Heroku](https://github.com/upleveled/auth0-node-heroku).

Illustration of problem area for https://github.com/gatsbyjs/gatsby/issues/20745.

## Set up Auth0

Setup for Auth0 is fast and easy:

1. [Sign up for a free account at Auth0](https://auth0.com/), go to [the Dashboard](https://manage.auth0.com) and hit the **Create** button:
   ![Auth0 Dashboard](https://raw.githubusercontent.com/upleveled/gatsby-serverside-auth0/master/.readme/01-auth0.png)
2. Create an application with the "Regular Web Application" template:
   ![Create Regular Web Application](https://raw.githubusercontent.com/upleveled/gatsby-serverside-auth0/master/.readme/02-auth0.png)
3. Go to the **Settings** tab and make a note of the **Domain**, **Client ID** and **Client Secret**. This information will be used for the Heroku setup.
   ![Settings tab for application](https://raw.githubusercontent.com/upleveled/gatsby-serverside-auth0/master/.readme/03-auth0.png)

## Set up Heroku

Create a Heroku account at [Heroku - Sign up](https://signup.heroku.com/), and then click on this button:

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/upleveled/gatsby-serverside-auth0)

This will set up a new application on your Heroku account using this repo as a template.

Choose your own app name, and use it in the `AUTH0_CALLBACK_URL` field.

During setup you'll also be asked for some other environment variables, which is the information that we noted earlier in the Auth0 setup:

![Fill in Heroku environment variables](https://raw.githubusercontent.com/upleveled/gatsby-serverside-auth0/master/.readme/04-heroku.png)

After Heroku is set up, return to the Auth0 Settings page and enter the URL in the Allowed urls (replace **YOUR-APP** with the **App name** that you chose):

1. Enter your **Allowed Callback URLs**:
   ```
   http://localhost:3000/callback,https://YOUR-APP.herokuapp.com/callback
   ```
2. Enter your **Allowed Logout URLs**:
   ```
   http://localhost:3000,https://YOUR-APP.herokuapp.com
   ```

It should appear like this:

![Auth0 Callback URLs Configuration](https://raw.githubusercontent.com/upleveled/gatsby-serverside-auth0/master/.readme/05-auth0.png)
![Auth0 Save Changes](https://raw.githubusercontent.com/upleveled/gatsby-serverside-auth0/master/.readme/06-auth0.png)

Now everything should be set up! If you visit the application URL in a browser, Auth0 will ask for you to log in to the application:

![Auth0](https://raw.githubusercontent.com/upleveled/gatsby-serverside-auth0/master/.readme/07-auth0-login.png)

After logging in, the Gatsby default starter homepage will be displayed:

![App homepage](https://raw.githubusercontent.com/upleveled/gatsby-serverside-auth0/master/.readme/08-gatsby-starter-homepage.png)

If there are any messages passed through the query string in the URL by Auth0, they will be displayed:

![Auth0 query string messages](https://raw.githubusercontent.com/upleveled/gatsby-serverside-auth0/master/.readme/09-auth0-query-string-messages.png)

There is also rudimentary access control set up for Gatsby static pages in the Express server. It is configured to deny requests for any assets from the Gatsby website `src/pages/page-2.mdx` page:

![Access Denied on page 2](https://raw.githubusercontent.com/upleveled/gatsby-serverside-auth0/master/.readme/10-access-denied.png)

This access control serves as a proof of concept - hopefully new tools will become available for Gatsby to improve this workflow:

https://github.com/gatsbyjs/gatsby/issues/20745

Finally, if the user visits any file that doesn't exist in the `gatsby-website/public` folder, the Gatsby 404 page will be displayed:

![Gatsby 404 page](https://raw.githubusercontent.com/upleveled/gatsby-serverside-auth0/master/.readme/11-gatsby-404.png)

Log out of the app by visiting the `/logout` route.

## Run the Server Locally

If you want to run the server locally, you can do this as follows:

Install the dependencies.

```sh
npm install
```

Copy the contents of `.env.example` to a new file called `.env` and replace the values for `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, and `AUTH0_CLIENT_SECRET` with your Auth0 information (from the Settings page). Replace `EXPRESS_SESSION_SECRET` with a secret to be used for the session.

```sh
# Copy configuration to replace with your own information
cp .env.example .env
```

Run the app.

```sh
npm start
```

The app will be served at `localhost:3000`.
