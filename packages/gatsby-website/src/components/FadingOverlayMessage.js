import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Alert from '@reach/alert';

const Overlay = styled(Alert)`
  position: fixed;
  top: 5em;
  left: 50vw;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  border-radius: 1em;
  padding: 0.9em;
  max-width: 60vw;
  transition: opacity 0.3s;
  opacity: 1;

  &.out {
    opacity: 0;
  }
`;

export default function FadingOverlayMessage(props) {
  const [message, setMessage] = useState(props.message || '');
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setFadingOut(true), 5000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setMessage('');
      setFadingOut(false);
    }, 5400);
    return () => clearTimeout(timeout);
  }, []);

  return message && <Overlay className={fadingOut && 'out'}>{message}</Overlay>;
}
