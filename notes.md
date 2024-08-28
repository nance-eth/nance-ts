## API steps to POST, PUT, & DELETE proposal:

1. [POST, PUT, DEL] Get space, proposal, envelope

2. [POST, PUT, DEL] Get res.local middleware vars

3. [PUT, DEL] getProposalByAnyId
     - !canEditProposal(dbProposal.status) -> return res.json(edit no longer allowed)

4. [POST, PUT, DEL] func{} validateUploaderAddress()

     - throw Error on mismatch

     - return {
         uploaderAddress,
         reciept,
         snapshotId
       }

5. [PUT, DEL] func{} permissions(address, proposal, config, operation)

     - archive -> author or spaceOwner

     - delete -> author, coauthor[0] (if non-sponsored proposal), or spaceOwner

     - if not permissioned throw Error

     - otherwise return true

6. [POST, PUT] func{} validateProposalByVp(uploadAddress, config)

     - get Snapshot vp

     - return {
         status,
         author,
         coauthors
       }

7. [POST, PUT] func{} assignProposalId(proposalStatus, dbProposalStatus?)

     - if draft -> getNextProposalId

     - Remove propsalId stuff from doltHandler, bad separation of concerns

     - return proposalId?: number

8. [POST, PUT] func{} assignGovernanceCycle(currentEvent, currentCycle, allowCurrentCycleSubmission, proposalStatus, dbProposalStatus?)
     - return governanceCycle: number

9. [POST, PUT] func{} buildProposal(proposal, dbProposal)

10. [POST, PUT, DEL] func{} logProposal(proposal, operation)

11a. [POST] addProposalToDb(builtProposal)
11b. [PUT] editProposal(builtProposal)
11c. [DEL] deleteProposal(proposal)

12. res.json()
      - return and then do background stuff so the user gets a quick response

13. [POST, PUT, DEL] func{} handleDiscord(proposal, dbProposal, builtProposal, proposalSubmissionValidation)

      - if discussion & !discussionURL -> discord.startDiscussion

      - if proposalSubmissionValid -> startPoll

      - discord.logout()

      - return discussionURL?

14. [POST] postSummary(builtProposal, "proposal")
      - dolt.updateSummary

15. [POST, PUT, DEL] clearCache(space)
