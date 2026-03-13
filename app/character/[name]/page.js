import { getCharacterByName } from '../../../lib/db/queries.js';
import CharacterRedirect from './CharacterRedirect';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://maple-hub.hanshino.dev';
const formatPower = num => (num ? num.toLocaleString() : '');

export async function generateMetadata({ params }) {
  const { name } = await params;
  const characterName = decodeURIComponent(name);
  const char = await getCharacterByName(characterName);

  if (!char) {
    return {
      title: `${characterName} — Maple Hub`,
      description: '角色未找到',
    };
  }

  const title = `${char.characterName} — Lv.${char.characterLevel} ${char.characterClass}`;
  const description = [
    `戰鬥力 ${formatPower(char.combatPower)}`,
    char.worldName && `伺服器: ${char.worldName}`,
    char.characterGuildName && `公會: ${char.characterGuildName}`,
  ]
    .filter(Boolean)
    .join(' | ');

  const ogImageUrl = `${SITE_URL}/character/${encodeURIComponent(char.characterName)}/opengraph-image`;

  return {
    title: `${char.characterName} | Maple Hub`,
    description,
    openGraph: {
      title,
      description,
      siteName: 'Maple Hub',
      type: 'profile',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${char.characterName} 角色資訊`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function CharacterPage({ params }) {
  const { name } = await params;
  const characterName = decodeURIComponent(name);
  return <CharacterRedirect name={characterName} />;
}
