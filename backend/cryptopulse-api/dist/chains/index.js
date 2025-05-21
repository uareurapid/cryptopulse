var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
import { addSupportedChain, getSupportedChains } from './service.js';
//import schema from './schema';
export const chainsRoutes = express.Router();
export const CHAINS_API_BASE_PATH = '/api/chains';
// returns all available/supported chains
chainsRoutes.get(`${CHAINS_API_BASE_PATH}/available`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json(yield getSupportedChains());
}));
chainsRoutes.post(`${CHAINS_API_BASE_PATH}/add`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        if (!body.chain_id || !body.chain_name || isNaN(body.chain_id)) {
            res.status(404).send({ error: 'Invalid or missing parameters!' });
        }
        const result = yield addSupportedChain(Number(body.chain_id), body.chain_name);
        res.json({ added: result });
    }
    catch (err) {
        res.status(500).send({ error: err.message });
    }
}));
//# sourceMappingURL=index.js.map