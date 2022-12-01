/* eslint-disable max-len */
import { oneLine, stripIndent } from 'common-tags';
import { keys } from '../../keys';
import { DoltHandler } from '../doltHandler';
import { getConfig } from '../../configLoader';
import { Proposal } from '../../types';

let config;
let dolt: DoltHandler;

async function setup() {
  config = await getConfig();
  dolt = new DoltHandler('jigglyjams', 'waterbox-governance', keys.DOLT_KEY, config.propertyKeys);
}

async function metadata() {
  console.log(await dolt.dolt.metadata());
}

async function main() {
  await setup();
  // const res = await dolt.addProposalToDb({
  //   title: 'hihi',
  //   body: 'things',
  //   type: 'Payout',
  //   governanceCycle: 33,
  //   status: 'Draft'
  // });
  // console.log(res);
  dolt.currentGovernanceCycle = 33;
  const proposals = [
    {
      hash: '95c841dcbbd04159939f6f38d764d3ae',
      title: 'Renew 0xSTVG Recurring Payout',
      url: 'https://juicebox.notion.site/Renew-0xSTVG-Recurring-Payout-95c841dcbbd04159939f6f38d764d3ae',
      type: 'Payout',
      status: 'Voting',
      proposalId: '',
      discussionThreadURL: 'https://discord.com/channels/775859454780244028/873248745771372584/1046884345069191168',
      ipfsURL: '',
      voteURL: '',
      date: '2022-11-22',
      governanceCycle: 37,
      version: 'V1',
      voteSetup: { type: undefined, choices: undefined },
      body: stripIndent`Synopsis

      Renew 0xSTVG recurring payout
      
      Motivation
      
      My recurring payout is set to expire after FC #37
      
      Specification
      
      I would like payouts to be routed to the MCSA Juicebox project - https://juicebox.money/@mcsa (v2 project #3)
      
      Rationale
      
      I continue to stay focused on lead generation, onboarding, social media presence, business development/partnerships.
      
      Business Development/Partnerships
      
      University Blockchain Clubs
      
      note: during this recurring duration I will be continuing to contact university groups but will focus on art, film, and business groups per a collab/strategy meeting with Jango
      
      Highlights September - November
      
      Stanford Blockchain Club - Nicholas and Jango spoke about the technical architecture of Juicebox. In person project set up in progress.
      
      University of Michigan Blockchain club - Nicholas, Filip and I spoke about project creation, new features of Juicebox, DAO contributing, DAO governance.
      
      Connected with Colombia University Blockchain club. They know Juicebox and are interested in us giving a prompt for their University hackathon in 2023 called Lions Den.
      
      Connected with two recent graduates from the London School of Economics through "cold emailing" Cambridge Blockchain. Set up a meeting which included Nicholas, Filip and myself to talk about Fyde.fi an on chain treasury management system. They want to run on JB.
      
      Working with LCLim and Ser (discord names) on their film The Shiba and the Whale - A Doge Anime
      
      Working with Burrito DAO, an artist collective, about starting a Juicebox. DMs are available if anyone wants to see them.
      
      Working with Black Label Art Culture on using NFT rewards for their artist reveals and gallery showings.
      
      Onboarded G-Play Studios
      
      Onboarded K-Group DAO
      
      Onboarded MP3 Radio
      
      Partnerships I missed from my last proposal:
      
      Talked with UCI, set up a meeting but couldnt get the meeting on November 21st to work. Aiming for January.
      Cal Berkeley Blockchain - in talks
      University of New South Wales - in talks
      Since September I have taken part in 31 appointments for onboarding or business development.
      
      Social Media
      
      Started the Defifa twitter account.
      Tweeted NFT per day leading up to the mint (scheduled out to auto tweet per day)
      Tweeted the hour countdown up until the end of mint (scheduled out to auto tweet per hour)
      Defifa daily stats through the minting phase
      Continued activitiy about defifa, stats, facts and pointing system
      Defifa point tracking document
      Also produced Defifa stickers. Handed off to Jango.
      Defifa420 twitter handle stats
      
      
      
      
      
      Generally staying well informed of all the things going on in the Juicebox ecosystem. This allows me to create concise and informative weekly recap threads. The threads also served (imo) as the foundation for the Juicenews Newsletter.
      
      Lead Generation
      
      I continue to evangelize Juicebox via social media. When I describe lead generation I am specifically talking about twitter DMs, Instagram DMs, joining discord groups in order to find pepole that are interested in building on Juicebox. In this next duration I will be focused on generating leads in the non-profit fundraising space.
      
      Frontend and Protocol Testing
      
      Through my onboarding continually am doing different reconfigurations and testing. I offer suggestions to the Peel team and the protocol gurus. I did extensive testing of the NFT rewards contract after a “call to action” from Jango - https://discord.com/channels/775859454780244028/987105293810938007/1035196863755845652
      
      Met with @Strath McKay to go over creation flow back in September. Was able to go over the creation flow after it was initially created to give feedback.
      
      Risks
      
      I stop doing the work.
      
      Another risk that I want to make the DAO aware of is that each project is in a different stage of development. I try and work with people who have an MVP or at least a roadmap but not all projects are organized.
      
      Timeline
      
      Start Funding Cycle #38. End Funding Cycle #42`
    },
    {
      hash: 'a1a377141e8d41a99c9f45ce4f59d822',
      title: 'Refund Gas Fees to v1 Defifa Minters',
      url: 'https://juicebox.notion.site/Refund-Gas-Fees-to-v1-Defifa-Minters-a1a377141e8d41a99c9f45ce4f59d822',
      type: 'Payout',
      status: 'Voting',
      proposalId: '',
      discussionThreadURL: 'https://discord.com/channels/775859454780244028/873248745771372584/1046909391212908647',
      ipfsURL: '',
      voteURL: '',
      date: '2022-11-23',
      governanceCycle: 37,
      version: '',
      voteSetup: { type: 'basic', choices: undefined },
      body: stripIndent`Synopsis

      Reimburse gas fees from the v1 Defifa mint
      
      Motivation
      
      What problem does this solve? Why now?
      
      Specification
      
      Reimburse the following addresses the following amounts:
      
      Total amount 0.333012942
      
      | Eth Amount | Address | | | -------------- | ------------------------------------------ | - | | 0.003870633293 | 0xa13d49fcbf79eaf6a0a58cbdd3361422db4eaff1 | | | 0.004385723214 | 0xe7879a2d05dba966fcca34ee9c3f99eee7edefd1 | | | 0.01769960353 | 0x8b80755c441d355405ca7571443bb9247b77ec16 | | | 0.1425401095 | 0x28c173b8f20488eef1b0f48df8453a2f59c38337 | | | 0.007711132821 | 0x25910143c255828f623786f46fe9a8941b7983bb | | | 0.01208481354 | 0xa8488938161c9afa127e93fef6d3447051588664 | | | 0.01642636938 | 0x60ec27dd38c190f9392dde8abe0fa0c52517fca0 | | | 0.007872954672 | 0x6ab075abfa7cdd7b19fa83663b1f2a83e4a957e3 | | | 0.005947868375 | 0xba740c9035ff3c24a69e0df231149c9cd12bae07 | | | 0.1074666057 | 0x823b92d6a4b2aed4b15675c7917c9f922ea8adad | | | 0.007007128035 | 0x60535a6605958fff6cec5b1e92892601efb3473b | |
      
      Rationale
      
      Refunding gas for v1 mint was mentioned in the discord.
      
      Risks
      
      The amount might be not worth the cost of gas.
      
      Timeline
      
      FC #37`
    },
    {
      hash: '570bd48f648b4333a8aecae03ec17c66',
      title: 'Update Reserved Token Allocation; Maintain DAO Reserve',
      url: 'https://juicebox.notion.site/Update-Reserved-Token-Allocation-Maintain-DAO-Reserve-570bd48f648b4333a8aecae03ec17c66',
      type: 'Funding Cycle Reconfiguration',
      status: 'Voting',
      proposalId: '',
      discussionThreadURL: 'https://discord.com/channels/775859454780244028/873248745771372584/1046833500348756058',
      ipfsURL: '',
      voteURL: '',
      date: '2022-11-28',
      governanceCycle: 0,
      version: '',
      voteSetup: { type: 'basic', choices: undefined },
      body: stripIndent`Thesis

      Update the reserved list.
      
      Motivation
      
      JBP-292 - Update Reserved Token Allocation; Reduce DAO Reserve was rejected by the DAO, meaning the reserve list still does not match the list of individuals currently contributing to the DAO.
      
      One potential reason for JBP-292’s rejection was an decrease in the reserved allocation to the DAO. This proposal aims to update the reserved list while maintaining the DAO’s reserved allocation.
      
      Specification
      
      For all versions of the DAO’s projects:
      
      Reserve 30% of JBX for dao.jbx.eth and evenly split the remaining 70% between:
      
      burtula.eth
      jmill.eth
      jigglyjams.eth
      0xstvg.eth
      0x2DdA8dc2f67f1eB94b250CaEFAc9De16f70c5A51 (Viraz)
      filipv.eth
      zom-bae.eth
      jb.daodevinc.eth
      zhape.eth
      tankbottoms.eth
      peri.eth
      drgorilla.eth
      matthewbrooks.eth
      jango.eth
      sagekellyn.eth
      felixander.eth
      jb.0xba5ed.eth
      wraeth.eth
      twodam.eth
      aeolian.eth
      mieos.eth
      johnnyd.eth
      gulan.eth
      brileigh.eth
      strathmckay.eth
      0xa13d49fCbf79EAF6A0a58cBDD3361422DB4eAfF1 (blaz)
      Any “leftover” percentage which cannot be evenly divided shall be designated to dao.jbx.eth.
      
      Summary
      
      Added:
      
      strathmckay.eth
      0xa13d49fCbf79EAF6A0a58cBDD3361422DB4eAfF1 (blaz)
      Removed:
      
      natasha-pankina.eth
      zeugh.eth
      Rationale
      
      This specification largely matches the existing process, but has an up-to-date list of contributors.
      
      Risks
      
      This might not be the most effective use of reserved JBX. Many proposals to distribute the DAO’s reserved JBX have been rejected in the past.
      
      Timeline
      
      To be queued for the soonest funding cycle possible after this proposal’s Snapshot ratification.`
    },
    {
      hash: '4b9056d44d7b4a1080ca2682d72ffb56',
      title: 'Reallocate ETH From v1 → v3',
      url: 'https://juicebox.notion.site/Reallocate-ETH-From-v1-v3-4b9056d44d7b4a1080ca2682d72ffb56',
      type: 'Process Upgrades',
      status: 'Voting',
      proposalId: '',
      discussionThreadURL: 'https://discord.com/channels/775859454780244028/873248745771372584/1046845330240581684',
      ipfsURL: '',
      voteURL: '',
      date: '2022-11-28',
      governanceCycle: 0,
      version: '',
      voteSetup: { type: 'basic', choices: undefined },
      body: stripIndent`Thesis

      Instead of adding 1,205.31527829 ETH in the multisig to the v1 treasury balance, add that ETH to the v3 treasury balance.
      
      Motivation
      
      JBP-284 allocated 1,205.31527829 multisig ETH to the v1 treasury. If this ETH were deposited into the v1 treasury, it would generate 30.13 ETH in fees upon leaving the treasury, which would in turn erroneously issue 30.13 ETH worth of JBX to the reserved list and the multisig.
      
      This would also make DAO operations more complex: the sooner that the DAO can fully migrate to its v3 treasury, the simpler the DAO’s operations will be. Adding these funds to the v3 treasury will allow the DAO to begin migrating payouts and other distributions to its v3 treasury sooner, reducing the future complexity of governance and multisig operations.
      
      Specification
      
      Instead of adding 1,205.31527829 ETH to the v1 treasury’s balance, the multisig shall add that ETH to the DAO’s v3 treasury balance by calling the addToBalanceOf function on the v3 treasury’s JBETHERC20SplitsPayer.
      
      Rationale
      
      Calling the addToBalanceOf function will not mint any project tokens, meaning balances will be accurate.
      
      Risks
      
      The v1 contracts have held large amounts of ETH without any exploits or hacks. The v3 contracts might contain an exploit we are not yet aware of.
      This change will make it more difficult to enable v3 redemptions in a timely manner.
      These funds will not be available for redemption by v1 JBX holders until a v1 → v3 token migrator is deployed. This may take several months.
      Timeline
      
      To be executed within 36 days of this proposal’s Snapshot ratification.`
    },
    {
      hash: 'fc223e974d7c425791e0cea613984b34',
      title: 'Unless the ETH is Allocated to v3, Leave ETH in Multisig',
      url: 'https://juicebox.notion.site/Unless-the-ETH-is-Allocated-to-v3-Leave-ETH-in-Multisig-fc223e974d7c425791e0cea613984b34',
      type: 'Payout Reduction',
      status: 'Voting',
      proposalId: '',
      discussionThreadURL: 'https://discord.com/channels/775859454780244028/873248745771372584/1046849860986474497',
      ipfsURL: '',
      voteURL: '',
      date: '2022-11-28',
      governanceCycle: 0,
      version: '',
      voteSetup: { type: 'basic', choices: undefined },
      body: stripIndent``
    },
    {
      hash: '1d91ad7651624d1ca991da6d42c6cd8b',
      title: 'Transfer 200k funds: Juicebox v1 → v2 treasury (second time)',
      url: 'https://juicebox.notion.site/Transfer-200k-funds-Juicebox-v1-v2-treasury-second-time-1d91ad7651624d1ca991da6d42c6cd8b',
      type: 'Internal Bookkeeping Transfer',
      status: 'Voting',
      proposalId: '',
      discussionThreadURL: 'https://discord.com/channels/775859454780244028/873248745771372584/1046854517364363274',
      ipfsURL: '',
      voteURL: '',
      date: '2022-11-28',
      governanceCycle: 37,
      version: 'v1',
      voteSetup: { type: undefined, choices: undefined },
      body: stripIndent`Synopsis

      State what the proposal does in one sentence.
      
      Transfer treasury funds from v1 treasury to v2 treasury to cover ongoing payouts from the v2 treasury.
      
      Motivation
      
      What problem does this solve? Why now?
      
      The v2 treasury has been funded by JBP-210 with $200,000 USD and again in JBP-265 with an additional 200k. At the time of writing, the Juicebox V2 project has 37.07 ETH corresponding to $39,749. The account does not have a suffcient balance to cover the agreed upon payouts for FC-35. This proposal will transfer the necessary funds for to cover FC#35 and will be able to cover the next ~3 funding cycles.
      
      Specification
      
      How exactly will this be executed? Be specific and leave no ambiguity.
      
      Transfer @$200,000 from Juicebox v1 treasury to Juicebox v2 treasury.
      
      Rationale
      
      Why is this specification appropriate?
      
      If we do not do the specification, we will not be able to payout the v2 projects obligations and would be forced to “default” on the projects obligations or move payouts from v2 to v1.
      
      The $200,000 value is arbitrary and I invited debate/feedback on this value in the discussion.
      
      Risks
      
      What might go wrong?
      
      Juicebox has passed obligations to fund contributors via V2, there currently is not the funding to sufficiently cover that balance. By not passing this proposal, the DAO risks harming those contributors.
      
      Timeline
      
      When exactly should this proposal take effect? When exactly should this proposal end?
      
      This transfer will occur as soon as possible in FC#37`
    }
  ];

  dolt.updateProposalStatuses(proposals);
}

main();
