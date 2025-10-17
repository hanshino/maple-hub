import Image from 'next/image';
import { memo } from 'react';
import { Box, Typography, Avatar, CardContent } from '@mui/material';
import ProgressBar from './ProgressBar';

const CharacterCard = memo(function CharacterCard({
  character,
  historicalData = null,
}) {
  const progress = parseFloat(character.character_exp_rate || 0) / 100;

  return (
    <CardContent
      role="region"
      aria-labelledby={`character-${character.ocid || character.character_name}`}
      sx={{ p: 3 }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'center', sm: 'flex-start' },
          mb: 3,
        }}
      >
        {character.character_image && (
          <Avatar
            src={character.character_image}
            alt={`${character.character_name} 角色頭像`}
            sx={{ width: 64, height: 64, mb: { xs: 2, sm: 0 }, mr: { sm: 2 } }}
          />
        )}
        <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography
            id={`character-${character.ocid || character.character_name}`}
            variant="h6"
            component="h3"
            sx={{ wordBreak: 'break-word', mb: 0.5 }}
          >
            {character.character_name}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            aria-label={`伺服器: ${character.world_name}`}
          >
            {character.world_name}
          </Typography>
        </Box>
      </Box>{' '}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" component="span" fontWeight="medium">
            職業:
          </Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {character.character_class} {character.character_class_level}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" component="span" fontWeight="medium">
            等級:
          </Typography>
          <Typography
            variant="body2"
            aria-label={`等級 ${character.character_level}`}
          >
            {character.character_level}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" component="span" fontWeight="medium">
            性別:
          </Typography>
          <Typography variant="body2">{character.character_gender}</Typography>
        </Box>
        {character.character_date_create && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" component="span" fontWeight="medium">
              創建日期:
            </Typography>
            <Typography variant="body2">
              {new Date(character.character_date_create).toLocaleDateString(
                'zh-TW'
              )}
            </Typography>
          </Box>
        )}
        {character.character_guild_name && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" component="span" fontWeight="medium">
              公會:
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
              {character.character_guild_name}
            </Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ mb: 3 }} aria-labelledby="progress-section">
        <Typography id="progress-section" variant="srOnly">
          經驗值進度
        </Typography>
        <ProgressBar
          progress={progress}
          expRate={5}
          historicalData={historicalData}
        />
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', textAlign: { xs: 'center', sm: 'left' } }}
        dateTime={
          character.date
            ? new Date(character.date).toISOString()
            : new Date().toISOString()
        }
        aria-label={`最後更新時間 ${character.date ? new Date(character.date).toLocaleString() : new Date().toLocaleString()}`}
      >
        最後更新:{' '}
        {character.date
          ? new Date(character.date).toLocaleString()
          : new Date().toLocaleString()}
      </Typography>
    </CardContent>
  );
});

export default CharacterCard;
