import { ImageResponse } from 'next/og';
import { getCharacterByName } from '../../../lib/db/queries.js';
import { formatChineseNumber } from '../../../lib/statsUtils.js';

export const runtime = 'nodejs';
export const alt = 'Maple Hub - 角色資訊';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const HEXA_CORE_MAX_LEVEL = 30;

function getHexaProgress(hexaCores) {
  if (!hexaCores?.length) return null;
  const totalLevel = hexaCores.reduce(
    (sum, c) => sum + (c.hexaCoreLevel || 0),
    0
  );
  const maxTotal = hexaCores.length * HEXA_CORE_MAX_LEVEL;
  const percent = Math.round((totalLevel / maxTotal) * 100);
  return { totalLevel, maxTotal, coreCount: hexaCores.length, percent };
}

export default async function OgImage({ params }) {
  const { name } = await params;
  const characterName = decodeURIComponent(name);
  const char = await getCharacterByName(characterName);

  if (!char) {
    return new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1210 0%, #2d1f15 100%)',
          color: '#fff7ec',
          fontSize: 48,
          fontFamily: 'sans-serif',
        }}
      >
        🍁 Maple Hub — 角色未找到
      </div>,
      { ...size }
    );
  }

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background:
          'linear-gradient(135deg, #fff7ec 0%, #ffe8cc 50%, #ffd4a3 100%)',
        fontFamily: 'sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative maple leaves */}
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          fontSize: 200,
          opacity: 0.08,
          transform: 'rotate(15deg)',
          display: 'flex',
        }}
      >
        🍁
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          fontSize: 150,
          opacity: 0.06,
          transform: 'rotate(-20deg)',
          display: 'flex',
        }}
      >
        🍁
      </div>

      {/* Main content container */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          padding: '48px 60px',
          gap: 48,
        }}
      >
        {/* Left: Character image */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: 340,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 280,
              height: 280,
              borderRadius: 24,
              background: 'rgba(255, 255, 255, 0.6)',
              border: '2px solid rgba(247, 147, 30, 0.3)',
              boxShadow: '0 8px 32px rgba(247, 147, 30, 0.15)',
              overflow: 'hidden',
            }}
          >
            {char.characterImage ? (
              <img
                src={char.characterImage}
                width={240}
                height={240}
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div
                style={{
                  fontSize: 120,
                  display: 'flex',
                }}
              >
                🍁
              </div>
            )}
          </div>
        </div>

        {/* Right: Character info */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            gap: 12,
          }}
        >
          {/* Character name */}
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: '#1a1210',
              lineHeight: 1.1,
              display: 'flex',
            }}
          >
            {char.characterName}
          </div>

          {/* Level & Class */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginTop: 4,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 20px',
                borderRadius: 50,
                background: 'rgba(247, 147, 30, 0.15)',
                border: '1.5px solid rgba(247, 147, 30, 0.4)',
                fontSize: 24,
                fontWeight: 700,
                color: '#c46a00',
              }}
            >
              Lv.{char.characterLevel}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 20px',
                borderRadius: 50,
                background: 'rgba(247, 147, 30, 0.15)',
                border: '1.5px solid rgba(247, 147, 30, 0.4)',
                fontSize: 24,
                fontWeight: 700,
                color: '#c46a00',
              }}
            >
              {char.characterClass}
            </div>
          </div>

          {/* Combat Power + Hexa row */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 16,
            }}
          >
            {/* Combat Power */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '16px 24px',
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.5)',
                border: '1.5px solid rgba(247, 147, 30, 0.25)',
                gap: 4,
                flex: 1,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#8b6914',
                  display: 'flex',
                }}
              >
                戰鬥力
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: '#f7931e',
                  display: 'flex',
                }}
              >
                {char.combatPower ? formatChineseNumber(char.combatPower) : '-'}
              </div>
            </div>

            {/* Progress summary card - hexa + exp */}
            {(() => {
              const hexa = getHexaProgress(char.hexaCores);
              const expRate = parseFloat(char.characterExpRate || 0);
              if (!hexa && !expRate) return null;
              return (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px 24px',
                    borderRadius: 16,
                    background: 'rgba(255, 255, 255, 0.5)',
                    border: '1.5px solid rgba(147, 112, 219, 0.3)',
                    gap: 12,
                    width: 240,
                    flexShrink: 0,
                  }}
                >
                  {/* Hexa row */}
                  {hexa && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: '#6b4c9a',
                          display: 'flex',
                        }}
                      >
                        六轉進度
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 800,
                          color: '#7c3aed',
                          display: 'flex',
                        }}
                      >
                        {hexa.percent}%
                      </div>
                    </div>
                  )}
                  {/* Hexa progress bar */}
                  {hexa && (
                    <div
                      style={{
                        display: 'flex',
                        width: '100%',
                        height: 8,
                        borderRadius: 4,
                        background: 'rgba(147, 112, 219, 0.15)',
                        overflow: 'hidden',
                        marginTop: -4,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          width: `${hexa.percent}%`,
                          height: '100%',
                          borderRadius: 4,
                          background:
                            'linear-gradient(90deg, #7c3aed, #a78bfa)',
                        }}
                      />
                    </div>
                  )}
                  {/* EXP row */}
                  {expRate > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: '#2e7d32',
                          display: 'flex',
                        }}
                      >
                        經驗進度
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 800,
                          color: '#43a047',
                          display: 'flex',
                        }}
                      >
                        {expRate.toFixed(2)}%
                      </div>
                    </div>
                  )}
                  {/* EXP progress bar */}
                  {expRate > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        width: '100%',
                        height: 8,
                        borderRadius: 4,
                        background: 'rgba(46, 125, 50, 0.12)',
                        overflow: 'hidden',
                        marginTop: -4,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          width: `${Math.min(expRate, 100)}%`,
                          height: '100%',
                          borderRadius: 4,
                          background:
                            'linear-gradient(90deg, #43a047, #81c784)',
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Guild & World */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 8,
            }}
          >
            {char.worldName && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 22,
                  color: '#6b5a4e',
                  fontWeight: 600,
                }}
              >
                🌐 {char.worldName}
              </div>
            )}
            {char.characterGuildName && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 22,
                  color: '#6b5a4e',
                  fontWeight: 600,
                }}
              >
                👥 {char.characterGuildName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 60px',
          background: 'rgba(26, 18, 16, 0.85)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#f7931e',
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          🍁 Maple Hub
        </div>
        <div
          style={{
            display: 'flex',
            color: 'rgba(255, 247, 236, 0.7)',
            fontSize: 18,
          }}
        >
          maple-hub.hanshino.dev
        </div>
      </div>
    </div>,
    { ...size }
  );
}
