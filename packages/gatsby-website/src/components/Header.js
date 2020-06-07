import { Link } from 'gatsby';
import PropTypes from 'prop-types';
import React from 'react';

const Header = ({ siteTitle }) => (
  <div
    style={{
      background: 'rebeccapurple',
      color: 'white',
      marginBottom: '1.45rem',
    }}
  >
    <div
      style={{
        margin: '0 auto',
        maxWidth: 960,
        padding: '1.45rem 1.0875rem',
      }}
    >
      <h1>{siteTitle}</h1>
      <Link to="/" style={{ color: 'white' }}>
        Home
      </Link>
      &nbsp; &nbsp;
      <Link to="/page-2/" style={{ color: 'white' }}>
        Page 2 (denied)
      </Link>
      &nbsp; &nbsp;
      <Link to="/page-3/" style={{ color: 'white' }}>
        Page 3 (allowed)
      </Link>
      &nbsp; &nbsp;
      <Link to="/non-existent/" style={{ color: 'white' }}>
        Non-existent (404)
      </Link>
    </div>
  </div>
);

Header.propTypes = {
  siteTitle: PropTypes.string,
};

Header.defaultProps = {
  siteTitle: '',
};

export default Header;
