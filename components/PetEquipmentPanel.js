'use client';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

const formatExpiry = (dateStr) => {
  try {
    const d = new Date(dateStr);
    if (d.getFullYear() >= 2079) return '永久';
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
};

const PetCard = ({ pet }) => {
  if (!pet) return null;

  const { equipment, autoSkill, skills } = pet;
  const hasOptions = equipment?.item_option?.length > 0;
  const displayIcon = pet.appearanceIcon || pet.icon;
  const displayName = pet.nickname || pet.name;

  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 3 }}
      role="region"
      aria-label={`寵物：${displayName}`}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Pet header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
          {displayIcon && (
            <img
              src={displayIcon}
              alt={`${displayName} 圖示`}
              style={{
                width: 48,
                height: 48,
                objectFit: 'contain',
              }}
            />
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {displayName}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {pet.petType && (
                <Chip
                  label={pet.petType}
                  size="small"
                  sx={{
                    fontSize: '0.7rem',
                    height: 20,
                    backgroundColor: (theme) =>
                      alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                  }}
                />
              )}
              {pet.dateExpire && (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', ml: 0.5 }}
                >
                  {formatExpiry(pet.dateExpire)}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Pet description */}
        {pet.description && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '0.8rem',
              mb: 1,
              whiteSpace: 'pre-line',
              lineHeight: 1.5,
            }}
          >
            {pet.description}
          </Typography>
        )}

        {/* Pet equipment */}
        {equipment && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, mb: 1 }}
            >
              寵物裝備
            </Typography>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}
            >
              {equipment.item_icon && (
                <img
                  src={equipment.item_icon}
                  alt={`${equipment.item_name} 圖示`}
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: 'contain',
                  }}
                />
              )}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {equipment.item_name}
                </Typography>
                {equipment.scroll_upgrade > 0 && (
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary' }}
                  >
                    強化 +{equipment.scroll_upgrade}
                  </Typography>
                )}
              </Box>
            </Box>
            {hasOptions &&
              equipment.item_option.map((opt, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 0.25,
                    px: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {opt.option_type}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: 'primary.main' }}
                  >
                    +{opt.option_value}
                  </Typography>
                </Box>
              ))}
          </>
        )}

        {/* Auto skills */}
        {autoSkill && (autoSkill.skill_1 || autoSkill.skill_2) && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, mb: 1 }}
            >
              自動技能
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {autoSkill.skill_1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {autoSkill.skill_1_icon && (
                    <img
                      src={autoSkill.skill_1_icon}
                      alt={`${autoSkill.skill_1} 技能圖示`}
                      style={{ width: 24, height: 24, objectFit: 'contain' }}
                    />
                  )}
                  <Typography variant="body2">
                    {autoSkill.skill_1}
                  </Typography>
                </Box>
              )}
              {autoSkill.skill_2 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {autoSkill.skill_2_icon && (
                    <img
                      src={autoSkill.skill_2_icon}
                      alt={`${autoSkill.skill_2} 技能圖示`}
                      style={{ width: 24, height: 24, objectFit: 'contain' }}
                    />
                  )}
                  <Typography variant="body2">
                    {autoSkill.skill_2}
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}

        {/* Pet skills */}
        {skills?.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, mb: 1 }}
            >
              寵物技能
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {skills.map((skill, i) => (
                <Chip
                  key={i}
                  label={skill}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const processPetEquipmentData = (data) => {
  const pets = [];
  for (let i = 1; i <= 3; i++) {
    const name = data[`pet_${i}_name`];
    if (!name) continue;
    pets.push({
      name,
      nickname: data[`pet_${i}_nickname`],
      icon: data[`pet_${i}_icon`],
      description: data[`pet_${i}_description`],
      petType: data[`pet_${i}_pet_type`],
      equipment: data[`pet_${i}_equipment`],
      autoSkill: data[`pet_${i}_auto_skill`],
      skills: data[`pet_${i}_skill`] || [],
      dateExpire: data[`pet_${i}_date_expire`],
      appearance: data[`pet_${i}_appearance`],
      appearanceIcon: data[`pet_${i}_appearance_icon`],
    });
  }
  return pets;
};

const PetEquipmentPanel = ({ loading, error, pets, onRetry }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              重試
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!pets || pets.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">尚無寵物資料</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        py: 1,
      }}
    >
      {pets.map((pet, i) => (
        <PetCard key={i} pet={pet} />
      ))}
    </Box>
  );
};

export default PetEquipmentPanel;
