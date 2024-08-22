import { Router } from "express";
import { fetchSnapshotProposal } from "@/snapshot/snapshotProposals";

const router = Router();

router.get('/~/proposal/:pid', async (req, res) => {
  try {
    const proposal = await fetchSnapshotProposal(req.params.pid);
    res.json({ success: true, data: proposal });
  } catch (e) {
    res.json({ success: false, error: e });
  }
});

export default router;
