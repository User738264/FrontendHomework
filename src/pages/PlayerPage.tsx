import React from 'react';
import { useNavigate } from 'react-router-dom';
import PresentationPlayer from '../components/PresentationPlayer';

const PlayerPage: React.FC = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/editor');
  };

  return <PresentationPlayer onClose={handleClose} />;
};

export default PlayerPage;