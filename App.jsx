import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [rounds, setRounds] = useState([])
  const [currentRound, setCurrentRound] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedRounds = localStorage.getItem('golfRounds')
    if (savedRounds) {
      try {
        setRounds(JSON.parse(savedRounds))
      } catch (e) {
        console.error('Error loading saved rounds:', e)
      }
    }
  }, [])

  // Save data to localStorage whenever rounds change
  useEffect(() => {
    localStorage.setItem('golfRounds', JSON.stringify(rounds))
  }, [rounds])

  const startNewRound = () => {
    const newRound = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      courseName: '',
      totalScore: 0,
      holes: Array.from({ length: 18 }, (_, i) => ({
        hole: i + 1,
        par: 4,
        score: 0,
        fairwayHit: false,
        greenInRegulation: false,
        putts: 0
      }))
    }
    setCurrentRound(newRound)
    setActiveTab('scorecard')
  }

  const saveRound = () => {
    if (currentRound) {
      const totalScore = currentRound.holes.reduce((sum, hole) => sum + hole.score, 0)
      const updatedRound = { ...currentRound, totalScore }
      
      const existingIndex = rounds.findIndex(r => r.id === currentRound.id)
      if (existingIndex >= 0) {
        const updatedRounds = [...rounds]
        updatedRounds[existingIndex] = updatedRound
        setRounds(updatedRounds)
      } else {
        setRounds([...rounds, updatedRound])
      }
      
      setCurrentRound(null)
      setActiveTab('dashboard')
    }
  }

  const updateHole = (holeIndex, field, value) => {
    if (currentRound) {
      const updatedHoles = [...currentRound.holes]
      updatedHoles[holeIndex] = { ...updatedHoles[holeIndex], [field]: value }
      setCurrentRound({ ...currentRound, holes: updatedHoles })
    }
  }

  const updateRoundInfo = (field, value) => {
    if (currentRound) {
      setCurrentRound({ ...currentRound, [field]: value })
    }
  }

  // Calculate statistics
  const calculateStats = () => {
    if (rounds.length === 0) return {
      totalRounds: 0,
      avgScore: 0,
      bestScore: 0,
      fairwayPercentage: 0,
      girPercentage: 0,
      avgPutts: 0
    }

    const totalRounds = rounds.length
    const scores = rounds.map(r => r.totalScore).filter(s => s > 0)
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0
    const bestScore = scores.length > 0 ? Math.min(...scores) : 0
    
    // Calculate advanced stats
    const allHoles = rounds.flatMap(r => r.holes || [])
    const fairwayHits = allHoles.filter(h => h.fairwayHit).length
    const totalFairways = allHoles.filter(h => h.par > 3).length // Only count par 4 and 5
    const fairwayPercentage = totalFairways > 0 ? ((fairwayHits / totalFairways) * 100).toFixed(1) : 0
    
    const girHits = allHoles.filter(h => h.greenInRegulation).length
    const girPercentage = allHoles.length > 0 ? ((girHits / allHoles.length) * 100).toFixed(1) : 0
    
    const totalPutts = allHoles.reduce((sum, h) => sum + (h.putts || 0), 0)
    const avgPutts = allHoles.length > 0 ? (totalPutts / allHoles.length).toFixed(1) : 0

    return {
      totalRounds,
      avgScore,
      bestScore,
      fairwayPercentage,
      girPercentage,
      avgPutts
    }
  }

  const stats = calculateStats()

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
          padding: '24px', 
          marginBottom: '24px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                background: '#059669', 
                padding: '12px', 
                borderRadius: '50%', 
                color: 'white',
                fontSize: '24px'
              }}>
                ⛳
              </div>
              <div>
                <h1 style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: '#065f46', 
                  margin: '0 0 4px 0' 
                }}>
                  Golf Score Tracker
                </h1>
                <p style={{ 
                  color: '#059669', 
                  margin: 0, 
                  fontSize: '16px' 
                }}>
                  ติดตามและวิเคราะห์สกอร์กอล์ฟของคุณ
                </p>
              </div>
            </div>
            <button 
              onClick={startNewRound}
              style={{
                background: '#059669',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>+</span>
              <span>เริ่มรอบใหม่</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
          marginBottom: '24px' 
        }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
            {[
              { id: 'dashboard', label: 'แดชบอร์ด' },
              { id: 'scorecard', label: 'บันทึกสกอร์' },
              { id: 'history', label: 'ประวัติ' },
              { id: 'stats', label: 'สถิติ' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '16px 24px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab.id ? '2px solid #059669' : '2px solid transparent',
                  color: activeTab === tab.id ? '#059669' : '#6b7280'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '24px' 
            }}>
              {[
                { label: 'รอบที่เล่นทั้งหมด', value: stats.totalRounds },
                { label: 'สกอร์เฉลี่ย', value: stats.avgScore },
                { label: 'สกอร์ที่ดีที่สุด', value: stats.bestScore },
                { label: 'Fairway Hit %', value: `${stats.fairwayPercentage}%` },
                { label: 'GIR %', value: `${stats.girPercentage}%` },
                { label: 'Putts เฉลี่ย', value: stats.avgPutts }
              ].map((stat, index) => (
                <div key={index} style={{ 
                  background: 'white', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
                  padding: '24px' 
                }}>
                  <h3 style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#6b7280', 
                    margin: '0 0 8px 0' 
                  }}>
                    {stat.label}
                  </h3>
                  <div style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold', 
                    color: '#111827' 
                  }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Rounds */}
            <div style={{ 
              background: 'white', 
              borderRadius: '12px', 
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
              padding: '24px' 
            }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                margin: '0 0 16px 0' 
              }}>
                รอบล่าสุด
              </h2>
              {rounds.length === 0 ? (
                <p style={{ 
                  color: '#6b7280', 
                  textAlign: 'center', 
                  padding: '32px 0' 
                }}>
                  ยังไม่มีข้อมูลการเล่น เริ่มบันทึกรอบแรกของคุณ!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {rounds.slice(-5).reverse().map((round) => (
                    <div key={round.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '12px', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px' 
                    }}>
                      <div>
                        <p style={{ 
                          fontWeight: '500', 
                          margin: '0 0 4px 0' 
                        }}>
                          {round.date}
                        </p>
                        <p style={{ 
                          fontSize: '14px', 
                          color: '#6b7280', 
                          margin: 0 
                        }}>
                          {round.courseName || 'ไม่ระบุสนาม'}
                        </p>
                      </div>
                      <div style={{ 
                        background: '#f3f4f6', 
                        padding: '8px 16px', 
                        borderRadius: '20px', 
                        fontSize: '18px', 
                        fontWeight: 'bold' 
                      }}>
                        {round.totalScore}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scorecard Tab */}
        {activeTab === 'scorecard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {currentRound ? (
              <>
                <div style={{ 
                  background: 'white', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
                  padding: '24px' 
                }}>
                  <h2 style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    margin: '0 0 16px 0' 
                  }}>
                    ข้อมูลรอบการเล่น
                  </h2>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '16px' 
                  }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#374151', 
                        marginBottom: '4px' 
                      }}>
                        วันที่
                      </label>
                      <input
                        type="date"
                        value={currentRound.date}
                        onChange={(e) => updateRoundInfo('date', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#374151', 
                        marginBottom: '4px' 
                      }}>
                        ชื่อสนาม
                      </label>
                      <input
                        type="text"
                        placeholder="ระบุชื่อสนามกอล์ฟ"
                        value={currentRound.courseName}
                        onChange={(e) => updateRoundInfo('courseName', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ 
                  background: 'white', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
                  padding: '24px' 
                }}>
                  <h2 style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    margin: '0 0 8px 0' 
                  }}>
                    บันทึกสกอร์แต่ละหลุม
                  </h2>
                  <p style={{ 
                    color: '#6b7280', 
                    margin: '0 0 16px 0' 
                  }}>
                    สกอร์รวม: {currentRound.holes.reduce((sum, hole) => sum + hole.score, 0)}
                  </p>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '24px' 
                  }}>
                    {currentRound.holes.map((hole, index) => (
                      <div key={hole.hole} style={{ 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px', 
                        padding: '16px' 
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          marginBottom: '12px' 
                        }}>
                          <h3 style={{ 
                            fontWeight: '600', 
                            margin: 0 
                          }}>
                            หลุม {hole.hole}
                          </h3>
                          <span style={{ 
                            background: '#f3f4f6', 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '12px' 
                          }}>
                            Par {hole.par}
                          </span>
                        </div>
                        
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: '12px', 
                          marginBottom: '12px' 
                        }}>
                          <div>
                            <label style={{ 
                              display: 'block', 
                              fontSize: '14px', 
                              fontWeight: '500', 
                              color: '#374151', 
                              marginBottom: '4px' 
                            }}>
                              Par
                            </label>
                            <input
                              type="number"
                              min="3"
                              max="5"
                              value={hole.par}
                              onChange={(e) => updateHole(index, 'par', parseInt(e.target.value) || 3)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '16px'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ 
                              display: 'block', 
                              fontSize: '14px', 
                              fontWeight: '500', 
                              color: '#374151', 
                              marginBottom: '4px' 
                            }}>
                              สกอร์
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={hole.score || ''}
                              onChange={(e) => updateHole(index, 'score', parseInt(e.target.value) || 0)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '16px'
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: '12px', 
                          marginBottom: '12px' 
                        }}>
                          <div>
                            <label style={{ 
                              display: 'block', 
                              fontSize: '14px', 
                              fontWeight: '500', 
                              color: '#374151', 
                              marginBottom: '4px' 
                            }}>
                              Putts
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={hole.putts || ''}
                              onChange={(e) => updateHole(index, 'putts', parseInt(e.target.value) || 0)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '16px'
                              }}
                            />
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            paddingTop: '24px' 
                          }}>
                            <input
                              type="checkbox"
                              id={`fairway-${index}`}
                              checked={hole.fairwayHit}
                              onChange={(e) => updateHole(index, 'fairwayHit', e.target.checked)}
                              disabled={hole.par === 3}
                              style={{ 
                                width: '16px', 
                                height: '16px' 
                              }}
                            />
                            <label htmlFor={`fairway-${index}`} style={{ 
                              fontSize: '14px' 
                            }}>
                              Fairway Hit
                            </label>
                          </div>
                        </div>

                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '16px' 
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px' 
                          }}>
                            <input
                              type="checkbox"
                              id={`gir-${index}`}
                              checked={hole.greenInRegulation}
                              onChange={(e) => updateHole(index, 'greenInRegulation', e.target.checked)}
                              style={{ 
                                width: '16px', 
                                height: '16px' 
                              }}
                            />
                            <label htmlFor={`gir-${index}`} style={{ 
                              fontSize: '14px' 
                            }}>
                              GIR
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: '12px', 
                    marginTop: '24px' 
                  }}>
                    <button 
                      onClick={() => setCurrentRound(null)}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: 'white',
                        color: '#374151',
                        cursor: 'pointer'
                      }}
                    >
                      ยกเลิก
                    </button>
                    <button 
                      onClick={saveRound}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#059669',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      บันทึกรอบ
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ 
                background: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
                padding: '48px', 
                textAlign: 'center' 
              }}>
                <div style={{ 
                  fontSize: '64px', 
                  marginBottom: '16px' 
                }}>
                  ⛳
                </div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  margin: '0 0 8px 0' 
                }}>
                  เริ่มบันทึกรอบใหม่
                </h3>
                <p style={{ 
                  color: '#6b7280', 
                  margin: '0 0 16px 0' 
                }}>
                  คลิกปุ่ม "เริ่มรอบใหม่" เพื่อเริ่มบันทึกสกอร์
                </p>
                <button 
                  onClick={startNewRound}
                  style={{
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  เริ่มรอบใหม่
                </button>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            padding: '24px' 
          }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              margin: '0 0 16px 0' 
            }}>
              ประวัติการเล่น
            </h2>
            {rounds.length === 0 ? (
              <p style={{ 
                color: '#6b7280', 
                textAlign: 'center', 
                padding: '32px 0' 
              }}>
                ยังไม่มีประวัติการเล่น
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rounds.slice().reverse().map((round) => (
                  <div key={round.id} style={{ 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px', 
                    padding: '16px' 
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '12px' 
                    }}>
                      <div>
                        <p style={{ 
                          fontWeight: '500', 
                          margin: '0 0 4px 0' 
                        }}>
                          {round.date}
                        </p>
                        <p style={{ 
                          fontSize: '14px', 
                          color: '#6b7280', 
                          margin: 0 
                        }}>
                          {round.courseName || 'ไม่ระบุสนาม'}
                        </p>
                      </div>
                      <div style={{ 
                        background: '#f3f4f6', 
                        padding: '8px 16px', 
                        borderRadius: '20px', 
                        fontSize: '18px', 
                        fontWeight: 'bold' 
                      }}>
                        {round.totalScore}
                      </div>
                    </div>
                    
                    {round.holes && (
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(9, 1fr)', 
                        gap: '4px', 
                        fontSize: '12px' 
                      }}>
                        {round.holes.slice(0, 9).map((hole) => (
                          <div key={hole.hole} style={{ 
                            textAlign: 'center', 
                            padding: '4px', 
                            background: '#f9fafb', 
                            borderRadius: '4px' 
                          }}>
                            <div style={{ fontWeight: '500' }}>{hole.hole}</div>
                            <div style={{ color: '#6b7280' }}>Par {hole.par}</div>
                            <div style={{ fontWeight: 'bold' }}>{hole.score}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '24px' 
          }}>
            <div style={{ 
              background: 'white', 
              borderRadius: '12px', 
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
              padding: '24px' 
            }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                margin: '0 0 16px 0' 
              }}>
                สถิติโดยรวม
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'รอบที่เล่นทั้งหมด', value: stats.totalRounds },
                  { label: 'สกอร์เฉลี่ย', value: stats.avgScore },
                  { label: 'สกอร์ที่ดีที่สุด', value: stats.bestScore },
                  { label: 'Fairway Hit %', value: `${stats.fairwayPercentage}%` },
                  { label: 'Green in Regulation %', value: `${stats.girPercentage}%` },
                  { label: 'Putts เฉลี่ยต่อหลุม', value: stats.avgPutts }
                ].map((stat, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <span>{stat.label}:</span>
                    <span style={{ fontWeight: 'bold' }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ 
              background: 'white', 
              borderRadius: '12px', 
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
              padding: '24px' 
            }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                margin: '0 0 16px 0' 
              }}>
                แนวโน้มสกอร์
              </h2>
              {rounds.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {rounds.slice(-10).map((round) => (
                    <div key={round.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center' 
                    }}>
                      <span style={{ fontSize: '14px' }}>{round.date}</span>
                      <span style={{ 
                        background: '#f3f4f6', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '14px', 
                        fontWeight: '500' 
                      }}>
                        {round.totalScore}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#6b7280' }}>ยังไม่มีข้อมูลแนวโน้ม</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

