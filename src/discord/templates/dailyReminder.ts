import { stripIndents } from "common-tags";
import { Proposal } from "@nance/nance-sdk";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import { getPreamble, simpleProposalList } from "../helpers";
import { getReminderImages } from "@/utils";

export const dailyImageReminder = async (
  day: number,
  imagesCID: string,
  governanceCycle: number,
  type: string,
  proposals: Proposal[],
  space: string,
  proposalIdPrefix: string,
  contentLink: string,
  endSeconds: number
) => {
  const { thumbnail, image } = await getReminderImages(imagesCID, day);
  const thumbnailAttachment = new AttachmentBuilder(thumbnail, { name: "thumbnail.png" });
  const imageAttachment = new AttachmentBuilder(image, { name: "image.png" });
  const preamble = getPreamble(type);

  const proposalsThisCycle = proposals.filter((proposal) => proposal.governanceCycle === governanceCycle);
  const proposalsNextCycle = proposals.filter((proposal) => proposal.governanceCycle === governanceCycle + 1);

  const message = new EmbedBuilder().setTitle("Governance Status").setDescription(stripIndents`
    Today is day ${day} of GC#${governanceCycle}\n
    ${preamble} [here](${contentLink}) by <t:${endSeconds}:f> (<t:${endSeconds}:R>)!`)
    .setThumbnail("attachment://thumbnail.png")
    .setImage("attachment://image.png");

  message.addFields([
    { name: "Proposals This Cycle", value: simpleProposalList(proposalsThisCycle, space, proposalIdPrefix) },
    { name: "Proposals Next Cycle", value: simpleProposalList(proposalsNextCycle, space, proposalIdPrefix) },
  ]);

  return {
    message,
    attachments: [thumbnailAttachment, imageAttachment]
  };
};

export const dailyBasicReminder = (
  governanceCycle: number,
  day: number,
  type: string,
  proposals: Proposal[],
  space: string,
  proposalIdPrefix: string,
  endSeconds?: number,
  customDomain?: string,
) => {
  const proposalsThisCycle = proposals.filter((proposal) => proposal.governanceCycle === governanceCycle);
  const proposalsNextCycle = proposals.filter((proposal) => proposal.governanceCycle === governanceCycle + 1);
  const message = new EmbedBuilder().setTitle("Governance Status")
    .setDescription(`Today is day ${day} of GC#${governanceCycle}\n`)
    .addFields(
      { name: "Current Event", value: type },
      { name: "Ends At", value: `<t:${endSeconds}:f> (<t:${endSeconds}:R>)` },
    );
  message.addFields([
    { name: "Proposals This Cycle", value: simpleProposalList(proposalsThisCycle, space, proposalIdPrefix, customDomain) },
    { name: "Proposals Next Cycle", value: simpleProposalList(proposalsNextCycle, space, proposalIdPrefix, customDomain) },
  ]);
  return { message, attachments: [] };
};
