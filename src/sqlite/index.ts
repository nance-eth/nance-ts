import Database from "better-sqlite3";
import { SQLProposal } from "@nance/nance-sdk";
import { dbOptions } from "../dolt/dbConfig";
import { DoltSQL } from "../dolt/doltSQL";
import { doltSys } from "../dolt/doltSys";

const nullCheck = (value: any) => {
  if (
    value === null
    || value === "null"
    || value === ""
    || value === 0
    || (Array.isArray(value) && value.length === 0)
  ) {
    return null;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
};

async function main() {
  const spaces = await doltSys.getAllSpaceConfig();
  const sys = new Database(`./db_files/_sys.db`);
  // create config table
  sys.exec(`
    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      space TEXT,
      display_name TEXT,
      created_at INTEGER,
      updated_at INTEGER,
      write_validation TEXT,
      proposal_id_prefix TEXT,
      space_owners TEXT,
      discord_settings TEXT,
      calendar TEXT,
      juicebox_project_id INTEGER,
      safe_address TEXT,
      governor_address TEXT,
      cycle_start_reference TEXT,
      cycle_stage_lengths TEXT,
      current_governance_cycle INTEGER,
      template TEXT
    )
  `);
  spaces.map(async (space) => {
    const db = new Database(`./db_files/${space.space}.db`);
    db.exec(`
      CREATE TABLE IF NOT EXISTS proposals (
        uuid TEXT PRIMARY KEY,
        created_at INTEGER,
        updated_at INTEGER,
        governance_cycle INTEGER,
        status TEXT,
        proposal_id_number INTEGER,
        title TEXT,
        body TEXT,
        author_address TEXT,
        author_discord_id TEXT,
        coauthor_addresses TEXT,
        discussion_url TEXT,
        proposal_summary TEXT,
        discussion_summary TEXT,
        temperature_check_results TEXT,
        vote_id TEXT,
        vote_type TEXT,
        vote_choices TEXT,
        vote_start INTEGER,
        vote_end INTEGER,
        vote_results TEXT,
        vote_count INTEGER,
        vote_quorum INTEGER
      )
    `);
    console.log("fetching", space.space);
    const dolt = new DoltSQL(dbOptions(space.space));
    // proposals
    const proposals = await dolt.queryRows('SELECT * FROM proposals') as SQLProposal[];
    console.log(`inserting ${proposals.length} proposals into ${space.space} db`);
    proposals.forEach((proposal, i) => {
      try {
        console.log("inserting", i);
        db.prepare(`
            INSERT INTO proposals (
              uuid,
              created_at,
              updated_at,
              governance_cycle,
              status,
              proposal_id_number,
              title,
              body,
              author_address,
              author_discord_id,
              coauthor_addresses,
              discussion_url,
              proposal_summary,
              discussion_summary,
              temperature_check_results,
              vote_id,
              vote_type,
              vote_choices,
              vote_start,
              vote_end,
              vote_results,
              vote_count,
              vote_quorum
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
          [
            nullCheck(proposal.uuid),
            nullCheck(proposal.createdTime.getTime()),
            nullCheck(proposal.lastEditedTime.getTime()),
            nullCheck(proposal.governanceCycle),
            nullCheck(proposal.proposalStatus),
            nullCheck(proposal.proposalId),
            nullCheck(proposal.title),
            nullCheck(proposal.body),
            nullCheck(proposal.authorAddress),
            nullCheck(proposal.authorDiscordId),
            nullCheck(proposal.coauthors),
            nullCheck(proposal.discussionURL),
            nullCheck(proposal.proposalSummary),
            nullCheck(proposal.threadSummary),
            nullCheck(proposal.temperatureCheckVotes),
            nullCheck(proposal.snapshotId),
            nullCheck(proposal.voteType),
            nullCheck(proposal.choices),
            nullCheck(null),
            nullCheck(null),
            nullCheck(proposal.snapshotVotes),
            nullCheck(proposal.voteAddressCount),
            nullCheck(null)
          ]
        );
      } catch (e) {
        console.log(proposal.uuid, proposal.title, proposal.governanceCycle);
        console.error(e);
      }
    });
    console.log("done");

    let chainId;
    const network = space.config.juicebox.network.toLowerCase();
    if (network === "mainnet") {
      chainId = 1;
    } else if (network === "op mainnet") {
      chainId = 10;
    } else if (network === "gnosis") {
      chainId = 100;
    }
    const safe_address = space.config.juicebox.gnosisSafeAddress
      ? `[${chainId}:${space.config.juicebox.gnosisSafeAddress}]`
      : null;

    const governor_address = space.config.juicebox.governorAddress
      ? `[${chainId}:${space.config.juicebox.governorAddress}]`
      : null;
    // config
    sys.prepare(`
      INSERT INTO config (
        space,
        display_name,
        created_at,
        updated_at,
        write_validation,
        proposal_id_prefix,
        space_owners,
        discord_settings,
        juicebox_project_id,
        safe_address,
        governor_address,
        cycle_start_reference,
        cycle_stage_lengths,
        current_governance_cycle,
        template
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      [
        space.space,
        space.displayName,
        nullCheck(new Date().getTime()),
        nullCheck(new Date().getTime()),
        null,
        nullCheck(space.config.proposalIdPrefix),
        nullCheck(space.spaceOwners),
        nullCheck(space.config.discord),
        nullCheck(space.config.juicebox.projectId),
        nullCheck(safe_address),
        nullCheck(governor_address),
        nullCheck(space.cycleStartReference),
        nullCheck(space.cycleStageLengths),
        nullCheck(space.currentGovernanceCycle),
        nullCheck(space.template)
      ]
    );
  });
}

main();
