import express, { Request, Response }from 'express'
import { addSupportedChain, getSupportedChains } from './service.js';
import { ChainModel } from '../models/DBModels.js';
//import schema from './schema';

export const chainsRoutes = express.Router()

export const CHAINS_API_BASE_PATH = '/api/chains'

// returns all available/supported chains
chainsRoutes.get(
  `${CHAINS_API_BASE_PATH}/available`,
  async (req: Request, res: Response) => {

    res.json(await getSupportedChains())
  }
)

chainsRoutes.post(
  `${CHAINS_API_BASE_PATH}/add`,
  async (req: Request, res: Response) => {

    try {
      const body = req.body as ChainModel
      if(!body.chain_id || !body.chain_name || isNaN(body.chain_id)) {
        res.status(404).send({error: 'Invalid or missing parameters!'})
      }
      const result = await addSupportedChain(Number(body.chain_id), body.chain_name)
      res.json({added: result})
    }catch(err: any) {
      res.status(500).send({error: err.message})
    }
    
  }
)