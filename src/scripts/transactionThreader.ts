import { myProvider, sleep } from '../utils';
import { Nance } from '../nance';
import { doltConfig, getConfig } from '../configLoader';
import { NanceTreasury } from '../treasury';
import { TenderlyHandler } from '../tenderly/tenderlyHandler';
import { GnosisHandler } from '../gnosis/gnosisHandler';
import { keys } from '../keys';

async function main() {
  const { config } = await doltConfig(process.env.CONFIG || '');
  const nance = new Nance(config);
  const tenderly = new TenderlyHandler({ account: 'jigglyjams', project: 'nance' });
  const currentGovernanceCycle = await nance.dProposalHandler.getCurrentGovernanceCycle();
  // const simProvider = await tenderly.getForkProvider(`GC#${currentGovernanceCycle}_${new Date().toISOString()}`, '5eb44014-34c7-4032-82ba-65a022733537');
  // console.log(simProvider);
  // const simURL = tenderly.getForkURL();
  // const simTreasury = new NanceTreasury(config, nance.dProposalHandler, simProvider);
  const realTreasury = new NanceTreasury(config, nance.dProposalHandler, myProvider('mainnet'));
  // const currentNonce = await GnosisHandler.getCurrentNonce(config.juicebox.gnosisSafeAddress, 'mainnet');
  // await sleep(2000);

  // // submit reconfig from payouts table to simulaiton
  const reconfig = await realTreasury.V3encodeReconfigureFundingCyclesOf();
  // await tenderly.sendTransaction(reconfig, config.juicebox.gnosisSafeAddress);
  // await tenderly.advanceTime(14 * 24 * 60 * 60);
  // const futureDistribution = await simTreasury.juiceboxHandlerV3.getDistributionLimit();
  // const distribution = await simTreasury.juiceboxHandlerV3.encodeDistributeFundsOf();
  // await tenderly.sendTransaction(distribution, config.juicebox.gnosisSafeAddress);
  
  // // get payoput info
  // const currentPayoutsList = (await nance.dProposalHandler.getPreviousPayoutsDb('V3', currentGovernanceCycle - 1));
  // const futurePayoutsList = (await nance.dProposalHandler.getPayoutsDb('V3'));

  // const currentDistribution = await realTreasury.juiceboxHandlerV3.getDistributionLimit();
  // const currentDistributionNum = Number(currentDistribution[0].toString())/10**18;
  // console.log('currentDistribution', currentDistributionNum);
  // const futureDistributionNum = Number(futureDistribution[0].toString())/10**18;
  // console.log('futureDistribution', futureDistributionNum);
  // const links = [
  //   { name: '🧱 Tenderly Simulation', value: simURL },
  //   { name: '😵‍💫 Transaction Diff', value: 'https://www.jbdao.org/juicebox?role=Bookkeeper' },
  //   { name: '🗃 Juicebox Safe Diff', value: 'https://juicebox.money/@juicebox/safe'},
  //   // { name: '', value: ''},
  //   { name: '✍️ Gnosis Transaction', value: 'https://app.safe.global/transactions/tx?safe=eth:0xAF28bcB48C40dBC86f52D459A6562F658fc94B1e&id=multisig_0xAF28bcB48C40dBC86f52D459A6562F658fc94B1e_0x746cd4eeddf716993ad2155175af0f903305c677d8386d92affdb6d373aee0dc' },
  //   // { name: '🔥 Den Transaction', value: '' },
  // ];
  
  // // need to functionize!!
  // const addPayouts = futurePayoutsList.filter((pay) => { 
  //   console.log(pay.payName, !currentPayoutsList.includes(pay));
  //   return !currentPayoutsList.some((p2) => { return pay.proposalId === p2.proposalId })
  // });

  // const removePayouts = currentPayoutsList.filter((pay) => { 
  //   return !futurePayoutsList.some((p2) => { return pay.proposalId === p2.proposalId })
  // });
  // console.log(addPayouts.map((pay) => { return pay.payName }));
  // console.log(futurePayoutsList.map((p) => { return { name: p.payName, pid: p.proposalId } }))
  // console.log(currentPayoutsList.map((p) => { return { name: p.payName, pid: p.proposalId } }))
  // console.log('added payouts');
  // console.log(addPayouts.map((p) => { return { name: p.payName, pid: p.proposalId } }))
  // console.log('remove payouts');
  // console.log(removePayouts.map((p) => { return { name: p.payName, pid: p.proposalId } }))
  
  // nance.dialogHandler.editTransactionMessage('1106740418282004541', 235, 'reconfigureV3', links);
  // const threadId = await nance.dialogHandler.createTransactionThread(226, 'reconfigureV3', currentDistributionNum, futureDistributionNum, links);
  // await nance.dialogHandler.sendTransactionSummary(threadId, addPayouts, removePayouts, currentDistributionNum, futureDistributionNum);
}

main();
