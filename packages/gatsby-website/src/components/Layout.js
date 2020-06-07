import React from 'react';
import PropTypes from 'prop-types';
import { StaticQuery, graphql } from 'gatsby';
import queryString from 'query-string';

import FadingOverlayMessage from './FadingOverlayMessage';
import Header from './Header';
import './Layout.css';

const Layout = ({ children, location = {} }) => {
  // For Auth0 messages passed over the query string in the URL
  const { message } = queryString.parse(location.search);

  return (
    <StaticQuery
      query={graphql`
        query SiteTitleQuery {
          site {
            siteMetadata {
              title
            }
          }
        }
      `}
      render={(data) => (
        <>
          <Header siteTitle={data.site.siteMetadata.title} />
          <FadingOverlayMessage message={message} />
          <div
            style={{
              margin: '0 auto',
              maxWidth: 960,
              padding: '0px 1.0875rem 1.45rem',
              paddingTop: 0,
            }}
          >
            {children}
          </div>
        </>
      )}
    />
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
