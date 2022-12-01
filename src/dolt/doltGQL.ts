import { gql } from 'graphql-request';

export const mutationDeleteBranch = gql`
mutation DeleteBranch(
  $repoName: String!,
  $ownerName: String!,
  $branchName: String!
){
  deleteBranch(
    repoName: $repoName
    ownerName: $ownerName
    branchName: $branchName
  )
}
`;
