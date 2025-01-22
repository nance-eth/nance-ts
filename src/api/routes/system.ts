import express from "express";
import { ConfigSpaceRequest, SpaceInfo } from "@nance/nance-sdk";
import { createDolthubDB, headToUrl } from "@/dolt/doltAPI";
import { dotPin } from "@/storage/storageHandler";
import { mergeConfig, uuidGen } from "@/utils";
import logger from "@/logging";
import { addDb, getDb, getSysDb } from "@/dolt/pools";
import { getAllSpaceInfo, getSpaceConfig } from "@/api/helpers/getSpace";
import { DEFAULT_CONFIG, DOLTHUB_REMOTE_URL } from "@/constants";

const router = express.Router();

router.get("/", (_, res) => {
  res.send("nance-ish control panel");
});

router.get("/uuid", async (_, res) => {
  res.json({ success: true, data: uuidGen() });
});

router.get("/config/:space", async (req, res) => {
  try {
    const { space } = req.params;
    const doltConfig = await getSpaceConfig(space);
    if (doltConfig) {
      res.json({ success: true, data: doltConfig });
    } else {
      throw new Error(`config ${space} not found`);
    }
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

router.get("/all", async (_, res) => {
  try {
    const allSpaceInfo = await getAllSpaceInfo();
    const infos = await Promise.all(allSpaceInfo.map(async (space) => {
      try {
        const dolt = getDb(space.name);
        const nextProposalId = await dolt.getNextProposalId();
        const dolthubLink = headToUrl(space.config.dolt.owner, space.config.dolt.repo || "");
        const spaceInfo: SpaceInfo = { ...space, dolthubLink, nextProposalId };

        if (space.config.juicebox.gnosisSafeAddress || space.config.juicebox.governorAddress) {
          spaceInfo.transactorAddress = {
            type: space.config.juicebox.gnosisSafeAddress ? "safe" : "governor",
            network: space.config.juicebox.network,
            address: space.config.juicebox.gnosisSafeAddress || space.config.juicebox.governorAddress || "",
          };
        }
        return spaceInfo;
      } catch {
        return null; // Skip spaces with errors
      }
    }));
    const data = infos.filter((info) => info !== null);
    res.json({ success: true, data });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

router.post("/config", async (req, res) => {
  try {
    const { config, spaceOwners, dryrun } = req.body as ConfigSpaceRequest;
    const { address } = res.locals as { address: string };
    const space = config.name.replaceAll(" ", "_").toLowerCase();
    const spaceConfig = await getSpaceConfig(space);
    const displayName = config.name;

    if (!address) throw new Error("no SIWE address found");

    // check if space exists and configurer is spaceOwner
    if (spaceConfig && !spaceConfig.spaceOwners.includes(address)) {
      throw new Error("configurer not spaceOwner!");
    }

    let proposalIdPrefix = config.proposalIdPrefix || config.name.slice(0, 3).toUpperCase();
    if (!proposalIdPrefix.includes("-")) {
      proposalIdPrefix = `${proposalIdPrefix}-`;
    }
    const configIn = (spaceConfig) ?
      mergeConfig(spaceConfig.config, { ...config, proposalIdPrefix }) :
      mergeConfig(DEFAULT_CONFIG, { ...config, proposalIdPrefix });
    const packedConfig = JSON.stringify({ address, config: configIn });
    const cid = await dotPin(packedConfig);
    let spaceOwnersCleaned: string[] = [];
    if (spaceOwners) {
      spaceOwnersCleaned = spaceOwners.map((owner) => { return owner.address; });
    }
    if (!spaceOwners) spaceOwnersCleaned = [address];
    if (!dryrun) {
      getSysDb().setSpaceConfig({
        space,
        displayName,
        cid,
        spaceOwners: spaceOwnersCleaned,
        config: configIn,
        autoEnable: 1,
      }).then(() => {
        res.json({ success: true, data: { space, spaceOwners: spaceOwnersCleaned } });
      }).catch((e) => {
        console.error(e);
        res.json({ success: false, error: e });
      });
    } else {
      console.log("dryrun");
      console.log(space, displayName, cid, spaceOwnersCleaned, configIn,);
      res.json({ success: true, data: { dryrun, space, displayName, cid, spaceOwnersIn: spaceOwnersCleaned, configIn, } });
    }

    // create space database if it doesn't exist
    logger.info(`[CREATE SPACE]: ${JSON.stringify(config)}`);
    if (!spaceConfig) {
      if (!dryrun) {
        getSysDb().createSpaceDB(space).then(async () => {
          addDb(space);
          const dolt = getDb(space);
          await getSysDb().createSchema(space);
          await createDolthubDB(space);
          await dolt.localDolt.addRemote(`${DOLTHUB_REMOTE_URL}/${space}`);
          await dolt.localDolt.push(true);
        }).catch((e) => {
          logger.error("[CREATE SPACE]:");
          logger.error(e);
        });
      }
    }
  } catch (e: any) {
    res.json({ success: false, error: e.message || "Unknown error" });
  }
});

// router.delete("/space/:space", async (req, res) => {
//   const { space } = req.params;

//   // get address from jwt (SIWE)
//   const jwt = req.headers.authorization?.split("Bearer ")[1];
//   const address = (jwt && jwt !== "null") ? await addressFromHeader(jwt) : null;
//   if (!address) {
//     res.json({ success: false, error: "[NANCE ERROR]: no SIWE address found" });
//     return;
//   }

//   // check if space exists and requester is spaceOwner
//   const spaceConfig = await getSpaceConfig(space);
//   if (!spaceConfig) {
//     res.json({ success: false, error: "[NANCE ERROR]: space not found" });
//     return;
//   }

//   if (!spaceConfig.spaceOwners.includes(address)) {
//     res.json({ success: false, error: "[NANCE ERROR]: requester not spaceOwner!" });
//     return;
//   }

//   try {
//     // Delete space from system database
//     await getSysDb().deleteSpaceConfig(space);

//     // Drop the space database
//     await getSysDb().dropSpaceDB(space);

//     res.json({ success: true, data: { message: `Space ${space} deleted successfully` } });
//   } catch (e) {
//     logger.error("[DELETE SPACE]:", e);
//     res.json({ success: false, error: e });
//   }
// });

export default router;
