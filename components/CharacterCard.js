import Image from 'next/image';
import { memo } from 'react';
import {
  Box,
  Typography,
  Avatar,
  CardContent,
  Divider,
  Button,
} from '@mui/material';

const CharacterCard = memo(function CharacterCard({
  character,
  historicalData = null,
  unionData = null,
  battlePower = null,
  onEquipmentClick = null,
}) {
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
      {battlePower && (
        <Box sx={{ mb: 3, p: 2, backgroundColor: '#f0f8ff', borderRadius: 1 }}>
          <Typography
            variant="body2"
            component="span"
            fontWeight="bold"
            color="primary"
          >
            戰鬥力:
          </Typography>
          <Typography
            variant="h6"
            sx={{ mt: 0.5, fontWeight: 'bold', color: 'primary.main' }}
          >
            {battlePower.toLocaleString()}
          </Typography>
        </Box>
      )}
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
      {unionData && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="body2" component="span" fontWeight="medium">
                戰地階級:
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                {unionData.union_grade}
              </Typography>
            </Box>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="body2" component="span" fontWeight="medium">
                戰地等級:
              </Typography>
              <Typography variant="body2">{unionData.union_level}</Typography>
            </Box>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="body2" component="span" fontWeight="medium">
                神器等級:
              </Typography>
              <Typography variant="body2">
                {unionData.union_artifact_level}
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
        </>
      )}
      {!unionData && character && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            聯盟戰地資訊: 無資料
          </Typography>
        </Box>
      )}
      {onEquipmentClick && (
        <Box sx={{ mb: 2, display: { xs: 'none', sm: 'block' } }}>
          <Button
            variant="contained"
            fullWidth
            onClick={onEquipmentClick}
            sx={{ fontWeight: 'medium' }}
          >
            裝備
          </Button>
        </Box>
      )}
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
