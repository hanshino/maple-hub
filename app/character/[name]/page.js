import { redirect } from 'next/navigation';
import { getCharacterByName } from '../../../lib/db/queries.js';

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

  return {
    title: `${char.characterName} | Maple Hub`,
    description,
    openGraph: {
      title,
      description,
      siteName: 'Maple Hub',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CharacterPage({ params }) {
  const { name } = await params;
  const characterName = decodeURIComponent(name);
  redirect(`/?name=${encodeURIComponent(characterName)}`);
}
