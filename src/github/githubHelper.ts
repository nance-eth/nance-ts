import { gql } from 'graphql-request';

interface FileChanges {
  path: string;
  contents: string;
}

export const queryOID = gql`
query OID ($owner: String!, $repo: String!){
  repository(owner: $owner, name: $repo) {
    defaultBranchRef {
      target {
        oid
      }
    }
  }
}`;

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
