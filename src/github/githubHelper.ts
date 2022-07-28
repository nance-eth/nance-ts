import { gql } from 'graphql-request';

export const mutationCommitAndPush = gql`
mutation CommitAndPush (
  $ownerSlashRepo: String!,
  $branch: String = "main",
  $commitMessage: String!,
  $fileChanges: FileChanges!,
  $expectedOid: GitObjectID!
){
  createCommitOnBranch(
    input: {
      branch: {
        repositoryNameWithOwner: $ownerSlashRepo,
        branchName: $branch
      },
      message :{
        headline: $commitMessage
      },
      fileChanges: $fileChanges
      expectedHeadOid: $expectedOid
  }) {
    commit{
      oid
    }
  }
}
`;
