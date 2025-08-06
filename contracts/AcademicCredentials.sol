// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract AcademicCredentials is ERC721URIStorage, AccessControl {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    struct Credential {
        address issuer;
        uint256 issueDate;
        uint256 expirationDate;
        bool revoked;
        string credentialType;
        string institutionName;
        string programName;
        uint256 grade;
        string metadataHash;
    }
    
    mapping(uint256 => Credential) public credentials;
    mapping(address => uint256[]) public holderCredentials;
    mapping(address => bool) public authorizedInstitutions;
    mapping(address => mapping(string => bool)) public institutionCredentials;
    
    event CredentialIssued(
        uint256 indexed tokenId,
        address indexed issuer,
        address indexed recipient,
        string credentialType,
        string institutionName
    );
    
    event CredentialRevoked(uint256 indexed tokenId);
    event InstitutionAuthorized(address indexed institution);
    event CredentialVerified(uint256 indexed tokenId, address indexed verifier);
    
    constructor() ERC721("AcademicCredential", "ACADCRED") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function authorizeInstitution(address institution) external onlyRole(DEFAULT_ADMIN_ROLE) {
        authorizedInstitutions[institution] = true;
        _setupRole(ISSUER_ROLE, institution);
        emit InstitutionAuthorized(institution);
    }
    
    function issueCredential(
        address recipient,
        string memory tokenURI,
        string memory credentialType,
        string memory institutionName,
        string memory programName,
        uint256 grade,
        uint256 expirationDate,
        string memory metadataHash
    ) external onlyRole(ISSUER_ROLE) returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _mint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        credentials[newTokenId] = Credential({
            issuer: msg.sender,
            issueDate: block.timestamp,
            expirationDate: expirationDate,
            revoked: false,
            credentialType: credentialType,
            institutionName: institutionName,
            programName: programName,
            grade: grade,
            metadataHash: metadataHash
        });
        
        holderCredentials[recipient].push(newTokenId);
        
        emit CredentialIssued(newTokenId, msg.sender, recipient, credentialType, institutionName);
        return newTokenId;
    }
    
    function revokeCredential(uint256 tokenId) external {
        require(
            _isApprovedOrOwner(msg.sender, tokenId) || 
            credentials[tokenId].issuer == msg.sender,
            "Not authorized"
        );
        
        credentials[tokenId].revoked = true;
        emit CredentialRevoked(tokenId);
    }
    
    function verifyCredential(uint256 tokenId) external view returns (
        address issuer,
        address holder,
        bool valid,
        string memory credentialType,
        string memory institutionName,
        string memory programName,
        uint256 grade,
        bool revoked
    ) {
        require(_exists(tokenId), "Token does not exist");
        
        Credential memory cred = credentials[tokenId];
        return (
            cred.issuer,
            ownerOf(tokenId),
            !cred.revoked && (cred.expirationDate == 0 || cred.expirationDate > block.timestamp),
            cred.credentialType,
            cred.institutionName,
            cred.programName,
            cred.grade,
            cred.revoked
        );
    }
    
    function getHolderCredentials(address holder) external view returns (uint256[] memory) {
        return holderCredentials[holder];
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
