import { myProvider, sleep } from '../utils';
import { Nance } from '../nance';
import { NanceTreasury } from '../treasury';
import { TenderlyHandler } from '../tenderly/tenderlyHandler';
import { GnosisHandler } from '../gnosis/gnosisHandler';
import { getSpaceInfo } from '../api/helpers/getSpaceInfo';
import { DiscordHandler } from '../discord/discordHandler';

async function main() {
  const info = await getSpaceInfo(process.env.CONFIG || '');
  await sleep(2000);
  const nance = new Nance(info.config);
  await sleep(2000);
//   const tenderly = new TenderlyHandler({ account: 'jigglyjams', project: 'nance' });
//   const currentGovernanceCycle = info.currentCycle
//   const simProvider = await tenderly.getForkProvider(`GC#${currentGovernanceCycle}_${new Date().toISOString()}`);
//   const simURL = tenderly.getForkURL();
//   const simTreasury = new NanceTreasury(info.config, nance.dProposalHandler, simProvider, currentGovernanceCycle);
//   const realTreasury = new NanceTreasury(info.config, nance.dProposalHandler, myProvider('mainnet'), currentGovernanceCycle);
//   const currentNonce = await GnosisHandler.getCurrentNonce(info.config.juicebox.gnosisSafeAddress, 'mainnet');
//   await sleep(2000);
//   console.log(currentNonce);

//   // // // submit reconfig from payouts table to simulaiton
//   const reconfig = await realTreasury.V3encodeReconfigureFundingCyclesOf();
//   await tenderly.sendTransaction(reconfig, info.config.juicebox.gnosisSafeAddress);
//   await tenderly.advanceTime(18 * 24 * 60 * 60);
//   const futureDistribution = await simTreasury.juiceboxHandlerV3.getDistributionLimit();
//   const distribution = await simTreasury.juiceboxHandlerV3.encodeDistributeFundsOf(true);
//   await tenderly.sendTransaction(distribution, info.config.juicebox.gnosisSafeAddress);
  
//   // // // get payoput info
//   const currentPayoutsList = (await nance.dProposalHandler.getPreviousPayoutsDb('V3', currentGovernanceCycle - 1));
//   // console.log('currentPayoutsList', currentPayoutsList.map((p) => { return { name: p.payName, pid: p.proposalId } }))
//   let total = 0;
//   const futurePayoutsList = (await nance.dProposalHandler.getPayoutsDb(currentGovernanceCycle));
//   console.log('futurePayoutsList', futurePayoutsList.map((p) => { total+= p.amount; return { name: p.payName, pid: p.proposalId, amount: p.amount } }))
//   // sum up all future payouts
// console.log('total', total);

//   const currentDistribution = await realTreasury.juiceboxHandlerV3.getDistributionLimit();
//   const currentDistributionNum = Number(currentDistribution[0].toString())/10**18;
//   // console.log('currentDistribution', currentDistributionNum);
//   const futureDistributionNum = Number(futureDistribution[0].toString())/10**18;
//   // console.log('futureDistribution', futureDistributionNum);
  const links = [
    { name: '🧱 Tenderly Simulation', value: 'https://dashboard.tenderly.co/jigglyjams/nance/fork/52317804-7e78-4561-b661-f65110727e2e', inline: true },
    // { name: '😵‍💫 Transaction Diff', value: 'https://www.jbdao.org/juicebox?role=Bookkeeper' },
    // { name: '🗃 Juicebox Safe Diff', value: 'https://juicebox.money/@juicebox/safe'},
  //   // { name: '', value: ''},
    // { name: '✍️ Gnosis Transaction', value: 'https://app.safe.global/transactions/tx?safe=eth:0xAF28bcB48C40dBC86f52D459A6562F658fc94B1e&id=multisig_0xAF28bcB48C40dBC86f52D459A6562F658fc94B1e_0x746cd4eeddf716993ad2155175af0f903305c677d8386d92affdb6d373aee0dc' },
  //   // { name: '🔥 Den Transaction', value: '' },
  ];
  
//   // need to functionize!!
//   const addPayouts = futurePayoutsList.filter((pay) => { 
//     console.log(pay.payName, !currentPayoutsList.includes(pay));
//     return !currentPayoutsList.some((p2) => { return pay.proposalId === p2.proposalId })
//   });

//   const removePayouts = currentPayoutsList.filter((pay) => { 
//     return !futurePayoutsList.some((p2) => { return pay.proposalId === p2.proposalId })
  // });
  // console.log(addPayouts.map((pay) => { return pay.payName }));
  // console.log(futurePayoutsList.map((p) => { return { name: p.payName, pid: p.proposalId } }))
  // console.log(currentPayoutsList.map((p) => { return { name: p.payName, pid: p.proposalId } }))
  // console.log('added payouts');
  // console.log(addPayouts.map((p) => { return { name: p.payName, pid: p.proposalId } }))
  // console.log('remove payouts');
  // console.log(removePayouts.map((p) => { return { name: p.payName, pid: p.proposalId } }))
  // const threadId = await nance.dialogHandler.createTransactionThread(currentNonce+1, 'reconfigureFundingCyclesOf', currentDistributionNum, futureDistributionNum, links);
  nance.dialogHandler.editTransactionMessage('1157495902693511198', 270, 'reconfigureFundingCyclesOf', links);
  // const threadId = await nance.dialogHandler.createTransactionThread(226, 'reconfigureV3', currentDistributionNum, futureDistributionNum, links);
  // await nance.dialogHandler.sendTransactionSummary(threadId, addPayouts, removePayouts, currentDistributionNum, futureDistributionNum);
}

main();
