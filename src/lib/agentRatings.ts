import { logger } from './logger';

const RATINGS_KEY = 'agent_collaboration_ratings_v1';

export interface AgentRating {
    id: string;
    targetAgentId: string;
    targetAgentName: string;
    fromAgentId: string;
    fromAgentName: string;
    dealId: string;
    rating: number; // 1-5
    comment: string;
    category: 'communication' | 'professionalism' | 'cooperation' | 'timing';
    createdAt: string;
}

/**
 * Save an agent rating
 */
export function saveAgentRating(rating: Omit<AgentRating, 'id' | 'createdAt'>): AgentRating {
    try {
        const ratings = getAllAgentRatings();

        const newRating: AgentRating = {
            ...rating,
            id: `rating_${Date.now()}`,
            createdAt: new Date().toISOString()
        };

        ratings.push(newRating);
        localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));

        logger.info(`Saved rating for agent ${rating.targetAgentId} from ${rating.fromAgentId}`);
        return newRating;
    } catch (error) {
        logger.error('Error saving agent rating:', error);
        throw error;
    }
}

/**
 * Get all agent ratings
 */
export function getAllAgentRatings(): AgentRating[] {
    try {
        const data = localStorage.getItem(RATINGS_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

/**
 * Get ratings for a specific agent
 */
export function getAgentRatings(agentId: string): AgentRating[] {
    return getAllAgentRatings().filter(r => r.targetAgentId === agentId);
}

/**
 * Calculate average rating for an agent
 */
export function getAgentAverageRating(agentId: string): number {
    const ratings = getAgentRatings(agentId);
    if (ratings.length === 0) return 0;

    const sum = ratings.reduce((s, r) => s + r.rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
}
