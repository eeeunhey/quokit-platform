'use client';

import { useState, useEffect } from 'react';
import { MapPin, Building2, Link as LinkIcon, Mail, Star, GitFork, ExternalLink, Calendar, TrendingUp, Users } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function DeveloperDetail({ username }: { username: string }) {
  const [profile, setProfile] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // GitHub API에서 런타임에 실시간 정보 가져오기
  useEffect(() => {
    setIsLoading(true);

    Promise.all([
      // 1. 유저 프로필 조회
      fetch(`https://api.github.com/users/${username}`).then(res => res.json()),
      // 2. 유저의 레포지토리를 별점순으로 5개 조회
      fetch(`https://api.github.com/users/${username}/repos?sort=stargazers_count&per_page=5`).then(res => res.json())
    ])
    .then(([profileData, reposData]) => {
      setProfile(profileData);
      setRepos(Array.isArray(reposData) ? reposData : []);
      setIsLoading(false);
    })
    .catch(err => {
      console.error("GitHub API 로드 실패", err);
      setIsLoading(false);
    });
  }, [username]);



  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#EEF5EE] border-t-[#6F8F72] rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-[#6B7280] mt-3">GitHub에서 {username}님의 데이터를 실시간으로 불러오는 중...</p>
      </div>
    );
  }

  if (!profile || profile.message === "Not Found") {
    return (
      <div className="text-center py-20 text-[#6B7280]">
        개발자를 찾을 수 없습니다. ({username})
      </div>
    );
  }

  const topRepo = repos.length > 0 ? repos[0] : null;
  const popularRepos = repos.length > 1 ? repos.slice(1, 5) : [];

  return (
    <div className="max-w-[1000px] mx-auto animate-in fade-in duration-500 pb-20">
      
      {/* 1. 상단 프로필 영역 */}
      <section className="mb-14">
        <h2 className="text-[14px] font-bold text-[#9CA3AF] mb-5 tracking-tight uppercase">개발자 정보</h2>
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start">
          <img 
            src={profile.avatar_url} 
            alt={profile.name || username} 
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-[2rem] object-cover ring-1 ring-black/5 shadow-sm shrink-0" 
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1F2937] tracking-tight">{profile.name || username}</h1>
            <span className="text-[#6B7280] font-medium text-[17px] mt-1.5 block">@{profile.login}</span>
            <p className="text-[#4B5563] mt-4 leading-relaxed max-w-2xl text-[15px] sm:text-base">
              {profile.bio || '등록된 소개가 없습니다.'}
            </p>

            {/* 팔로워 / 팔로잉 정보 (GitHub 스타일) */}
            <div className="flex items-center gap-4 mt-4 text-[14.5px] text-[#4B5563] font-medium">
              <span className="flex items-center gap-1.5 hover:text-[#6F8F72] transition-colors cursor-pointer">
                <Users className="w-4 h-4 text-[#9CA3AF]" />
                <strong className="text-[#1F2937]">{profile.followers?.toLocaleString() || 0}</strong> 팔로워
              </span>
              <span className="w-1 h-1 bg-[#D1D5DB] rounded-full"></span>
              <span className="flex items-center gap-1 hover:text-[#6F8F72] transition-colors cursor-pointer">
                <strong className="text-[#1F2937]">{profile.following?.toLocaleString() || 0}</strong> 팔로잉
              </span>
            </div>
            
            {/* 소속, 위치 등 세부 정보 */}
            <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3.5">
              <ProfileItem icon={Building2} label="소속" value={profile.company} />
              <ProfileItem icon={MapPin} label="위치" value={profile.location} />
              <ProfileItem icon={Mail} label="이메일" value={profile.email} isLink href={`mailto:${profile.email}`} />
              <ProfileItem icon={LinkIcon} label="웹사이트" value={profile.blog} isLink href={
                profile.blog?.startsWith('http') ? profile.blog : `https://${profile.blog}`
              } />
            </div>
          </div>
        </div>
      </section>

      {/* 구분선 */}
      <div className="w-full h-px bg-[#F3F4F6] mb-14" />

      {/* 2. 대표 저장소 영역 */}
      {topRepo && (
        <section className="mb-14">
          <div className="mb-5">
            <h2 className="text-[18px] font-bold text-[#1F2937] flex items-center gap-2">
              <Star className="w-5 h-5 text-[#6F8F72] fill-[#6F8F72]/20" /> 
              대표 저장소
            </h2>
            <p className="text-[14px] text-[#6B7280] mt-1.5">이 개발자가 만든 저장소 중 가장 많은 관심을 받은 프로젝트입니다.</p>
          </div>

          <div className="border border-[#E5E7EB] rounded-[24px] p-6 sm:p-8 bg-white shadow-sm hover:shadow-md hover:border-[#D1D5DB] transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] truncate pb-1">{topRepo.name}</h3>
                <p className="text-[#4B5563] mt-3 text-[14.5px] sm:text-[15px] leading-relaxed max-w-3xl">
                  {topRepo.description || '저장소 설명이 없습니다.'}
                </p>
                
                <div className="flex flex-wrap items-center gap-5 mt-7 text-[13px] font-semibold text-[#6B7280]">
                  {topRepo.language && (
                    <span className="flex items-center gap-1.5 text-[#1F2937]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3178c6]"></span>
                      {topRepo.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-[#9CA3AF]" /> {topRepo.stargazers_count?.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <GitFork className="w-4 h-4 text-[#9CA3AF]" /> {topRepo.forks_count?.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5 ml-auto sm:ml-0 text-[#9CA3AF] font-medium">
                    <Calendar className="w-4 h-4" /> 최근 원격 푸시: {new Date(topRepo.pushed_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <a 
                href={topRepo.html_url} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1F2937] text-white text-[14px] font-bold hover:bg-black transition-colors shrink-0 w-full sm:w-auto shadow-sm"
              >
                바로가기 <ExternalLink className="w-4 h-4 opacity-80" />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* 3. 인기 저장소 목록 */}
      {popularRepos.length > 0 && (
        <section className="mb-16">
          <h2 className="text-[18px] font-bold text-[#1F2937] mb-5">인기 저장소</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {popularRepos.map(repo => (
              <div 
                key={repo.id} 
                className="border border-[#F3F4F6] bg-white p-6 rounded-[20px] hover:border-[#E5E7EB] hover:shadow-sm transition-all duration-300 flex flex-col h-full"
              >
                <h3 className="text-[17px] font-bold text-[#1F2937] truncate">{repo.name}</h3>
                <p className="text-[14px] text-[#6B7280] mt-2.5 line-clamp-2 leading-relaxed flex-1">
                  {repo.description || '저장소 설명이 없습니다.'}
                </p>
                
                <div className="flex items-center gap-4 mt-6 text-[12.5px] font-semibold text-[#6B7280]">
                  {repo.language && (
                    <span className="flex items-center gap-1.5 text-[#4B5563]">
                      <span className={`w-2 h-2 rounded-full ${repo.language === 'Rust' ? 'bg-[#dea584]' : 'bg-[#3178c6]'}`}></span>
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-[#9CA3AF]" /> {repo.stargazers_count?.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="w-3.5 h-3.5 text-[#9CA3AF]" /> {repo.forks_count?.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}



    </div>
  );
}

// 헬퍼 컴포넌트: 프로필 세부 정보 라벨
function ProfileItem({ icon: Icon, label, value, isLink = false, href = "#" }: any) {
  if (!value) return null;
  
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#9CA3AF] uppercase tracking-wide">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      {isLink ? (
        <a href={href} target="_blank" rel="noreferrer" className="text-[14px] font-medium text-[#1F2937] hover:text-[#6F8F72] transition-colors truncate max-w-[200px] sm:max-w-xs block">
          {value}
        </a>
      ) : (
        <span className="text-[14px] font-medium text-[#1F2937] truncate max-w-[200px] sm:max-w-xs block">
          {value}
        </span>
      )}
    </div>
  );
}
