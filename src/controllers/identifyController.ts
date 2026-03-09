import type { Request, Response } from 'express';
import { reconcileIdentity } from '../services/identifyService.js';

export const identify = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, phoneNumber } = req.body;

        if (!email && !phoneNumber) {
            res.status(400).json({ error: 'Email or phoneNumber is required' });
            return;
        }

        const result = await reconcileIdentity({ email, phoneNumber });
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in identify:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
