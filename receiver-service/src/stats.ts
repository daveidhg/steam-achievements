import pino from "pino";

const logger = pino();

type Stats = {
    total_achievements: number;
    total_games: number;
    average_per_game: number;
    best_streak_days: number;
    achievements_by_weekday: Record<string, number>;
}

type Achievement = {
    id: number;
    steamid: string;
    appid: number;
    game_name: string;
    achievement_name: string;
    unlock_time: string; // ISO date string
    description: string;
}

export function createStats(achievements: Achievement[]): Stats {
    let total_achievements = achievements.length;
    let total_games = getTotalGames(achievements);
    return {
        total_achievements,
        total_games,
        average_per_game: total_achievements / total_games,
        best_streak_days: getBestStreakDays(achievements),
        achievements_by_weekday: getAchievementsByWeekday(achievements)
    }
}

function getTotalGames(achievements: Achievement[]): number {
    const uniqueGames = new Set(achievements.map(a => a.appid));
    return uniqueGames.size;
}

function getBestStreakDays(achievements: Achievement[]): number {
    if (achievements.length === 0) return 0;

    // Extract unique unlock dates (YYYY-MM-DD) and map them to unix time and sort them
    const uniqueDates = [
        ...new Set(achievements.map(a => a.unlock_time.toString().slice(0, 10)))
    ].map((a) => new Date(a).getTime()).sort()

    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
        const diffTime = uniqueDates[i] - uniqueDates[i - 1];
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
            currentStreak++;
        } 
        else if (diffDays > 1) {
            maxStreak = Math.max(maxStreak, currentStreak);
            currentStreak = 1;
        }
    }

    maxStreak = Math.max(maxStreak, currentStreak);
    return maxStreak;
}

function getAchievementsByWeekday(achievements: Achievement[]): Record<string, number> {
    const weekDayCounter: Record<string, number> = {
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0,
        Sunday: 0
    }

    achievements.forEach(achievement => {
        weekDayCounter[getDayOfWeek(achievement.unlock_time)]++;
    })

    return weekDayCounter;
}

function getDayOfWeek(date: string): string {
    const dayIndex = new Date(date).getDay();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return daysOfWeek[dayIndex];
}