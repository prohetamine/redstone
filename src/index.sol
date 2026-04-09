// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

struct Item {
    string index;
    address user;
    string text;
    uint256 timestamp;
}

struct Text {
    string text;
    uint256 timestamp;
}

contract Fun {
    using Strings for uint256;

    function escapeQuotes(string memory input) internal pure returns (string memory) {
        bytes memory src = bytes(input);
        bytes memory dst = new bytes(src.length * 2);
        uint256 j = 0;

        for (uint256 i = 0; i < src.length; i++) {
            bytes1 c = src[i];

            if (c == '"') {
                dst[j++] = '\\';
                dst[j++] = '"';
            } else if (c == '\\') {
                dst[j++] = '\\';
                dst[j++] = '\\';
            } else if (c == '\n') {
                dst[j++] = '\\';
                dst[j++] = 'n';
            } else if (c == '\r') {
                dst[j++] = '\\';
                dst[j++] = 'r';
            } else if (c == '\t') {
                dst[j++] = '\\';
                dst[j++] = 't';
            } else {
                dst[j++] = c;
            }
        }

        bytes memory out = new bytes(j);
        for (uint256 k = 0; k < j; k++) {
            out[k] = dst[k];
        }

        return string(out);
    }

    function uintToString(uint256 value) internal pure returns (string memory) {
        return value.toString();
    }

    function _a2s(address a) internal pure returns (string memory) {
        bytes20 value = bytes20(a);
        bytes16 hexSymbols = "0123456789abcdef";

        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";

        for (uint i = 0; i < 20; i++) {
            str[2 + i * 2]     = hexSymbols[uint8(value[i] >> 4)];
            str[3 + i * 2]     = hexSymbols[uint8(value[i] & 0x0f)];
        }
        return string(str);
    }

    function _u2s(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint256 j = v;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory b = new bytes(len);
        while (v != 0) {
            len--;
            b[len] = bytes1(uint8(48 + v % 10));
            v /= 10;
        }
        return string(b);
    }

    function randomHashString(string memory text) public view returns (string memory) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                text,
                block.timestamp,  
                block.prevrandao, 
                msg.sender
            )
        );

        return Strings.toHexString(uint256(hash), 32);
    }
}

contract Redstone is Fun, ReentrancyGuard {
    address internal owner;
    address internal token;
    uint256 internal ownerCommission = 0;
    uint256 internal ownerCertificateCommission = 0;

    mapping(bytes32 => address) internal partnerCertificateCommissionIDs;
    mapping(bytes32 => uint256) internal addedValueCertificateCommissionIDs;

    mapping(bytes32 => Text) internal fields;
    mapping(bytes32 => Item) internal listFields;
    mapping(bytes32 => uint256) internal listIndexs;
    mapping(bytes32 => uint256) internal counters;
    mapping(bytes32 => bool) internal counter;
    mapping(bytes32 => address) internal singles;

    uint256 internal noteStat = 0;
    uint256 internal listStat = 0;
    uint256 internal counterStat = 0;
    uint256 internal certStat = 0;
    uint256 internal coinStat = 0;

    constructor(address _token, uint256 _ownerCommission, uint256 _ownerCertificateCommission) {
        owner = msg.sender;
        token = _token;
        ownerCommission = _ownerCommission;
        ownerCertificateCommission = _ownerCertificateCommission;
    }

    function certificateCommissionID(string memory id, uint256 addedValue) public nonReentrant {
        require(bytes(id).length <= 128, "Id value too much");
        require(addedValue <= 100000000, "Added value too much");

        bytes32 _id = keccak256(abi.encodePacked(id));
        require(partnerCertificateCommissionIDs[_id] == address(0) && addedValueCertificateCommissionIDs[_id] == 0, "This ID has already been certified, change the ID to be certified again");
        address sender = msg.sender;

        require(
            IERC20(token).transferFrom(
                sender,
                owner,
                ownerCertificateCommission
            ),
            "Owner transfer failed"
        );

        partnerCertificateCommissionIDs[_id] = sender;
        addedValueCertificateCommissionIDs[_id] = addedValue;
        certStat++;
        coinStat += ownerCertificateCommission;
    }

    function getCommissionID(string memory id) view public returns (uint256) {
        bytes32 _id = keccak256(abi.encodePacked(id));
        if (partnerCertificateCommissionIDs[_id] != address(0)) {
            return addedValueCertificateCommissionIDs[_id] + ownerCommission;
        } else {
            return 0;     
        }
    }

    function getCertificateCommission() view public returns (uint256) {
        return ownerCertificateCommission;
    }

    ///////////////////////////////////////////////////////////////////////

    function payCommission (string memory id) internal {
        if (ownerCommission == 0) {
            return;   
        }

        bytes32 _id = keccak256(abi.encodePacked(id));
        require(partnerCertificateCommissionIDs[_id] != address(0), "ID not certified");

        require(
            IERC20(token).transferFrom(
                msg.sender,
                owner,
                ownerCommission
            ),
            "Owner transfer failed"
        );
        coinStat += ownerCommission;

        if (addedValueCertificateCommissionIDs[_id] != 0) {
            require(
                IERC20(token).transferFrom(
                    msg.sender,
                    partnerCertificateCommissionIDs[_id],
                    addedValueCertificateCommissionIDs[_id]
                ),
                "Partner transfer failed"
            );
            coinStat += addedValueCertificateCommissionIDs[_id];
        }
    }

    ///////////////////////////////////////////////////////////////////////

    function pingNetwork() pure public returns (bool) {
        return true;
    }

    ///////////////////////////////////////////////////////////////////////

    function statusRead() public view returns (string memory) {
        return string(
            abi.encodePacked(
                '{',
                    '"notes":"', _u2s(noteStat),
                    '","lists":"', _u2s(listStat),
                    '","counters":"', _u2s(counterStat),
                    '","certs":"', _u2s(certStat),
                    '","coins":"', _u2s(coinStat),
                '"}'
            )
        );
    }

    ///////////////////////////////////////////////////////////////////////

    function noteWrite(string memory id, string memory copyId, bool isCommission, bool isSelf, bool isOnce, bool isSingle, bool isRandomHash, bool isAddress, string memory text) public nonReentrant {
        require(bytes(id).length <= 128, "Id value too much");
        require(bytes(copyId).length <= 128, "CopyId value too much");
        require(bytes(text).length <= 5000, "Text value too much");
        
        address sender = address(0);
        if (isSelf) {
            sender = msg.sender;
        }

        bytes32 hashId = keccak256(abi.encodePacked(sender, id, copyId, isCommission, isSelf, isOnce, isSingle, isRandomHash, isAddress));
        
        if (isOnce) {
            require(bytes(fields[hashId].text).length == 0, "The field has already been used");  
        }

         if (isSingle) {
            require(singles[hashId] == address(0) || singles[hashId] == msg.sender, "Not owner");
        }

        if (isCommission) {
            payCommission(id);
        }

        if (isSingle && singles[hashId] != msg.sender) {
            singles[hashId] = msg.sender;
        }

        string memory _text = text;
        if (isRandomHash) {
            if (bytes(text).length > 0) {
                _text = randomHashString(text);
            } else {
                _text = "";
            }
        }

        if (isAddress) {
            if (bytes(text).length > 0) {
                _text = _a2s(msg.sender);
            } else {
                _text = "";
            }
        }

        fields[hashId] = Text({
            text: escapeQuotes(_text),
            timestamp: block.timestamp
        });
        noteStat++;
    }

    function noteRead(string memory id, string memory copyId, bool isCommission, bool isSelf, bool isOnce, bool isSingle, bool isRandomHash, bool isAddress, address _address) view public returns (string memory) {
        require(bytes(id).length <= 128, "Id value too much");
        require(bytes(copyId).length <= 128, "CopyId value too much");
        
        address _sender = _address;
        address sender = address(0);
        if (isSelf) {
            sender = _sender;
        }

        bytes32 hashId = keccak256(abi.encodePacked(sender, id, copyId, isCommission, isSelf, isOnce, isSingle, isRandomHash, isAddress));

        Text memory data = fields[hashId];
        return string(abi.encodePacked('{"text":"', data.text, '","timestamp":"', _u2s(data.timestamp), '"}'));
    }

    ///////////////////////////////////////////////////////////////////////

    function listRowWrite(string memory id, string memory copyId, bool isCommission, bool isSelf, bool isOnce, bool isSingle, bool isRandomHash, bool isAddress, string memory text) public nonReentrant {
        require(bytes(id).length <= 128, "Id value too much");
        require(bytes(copyId).length <= 128, "CopyId value too much");
        require(bytes(text).length <= 5000, "Text value too much");

        address sender = address(0);
        if (isSelf) {
            sender = msg.sender;
        }

        string memory _text = text;
        if (isRandomHash) {
            if (bytes(text).length > 0) {
                _text = randomHashString(text);
            } else {
                _text = "";
            }
        }

        if (isAddress) {
            if (bytes(text).length > 0) {
                _text = _a2s(msg.sender);
            } else {
                _text = "";
            }
        }

        bytes32 hashId = keccak256(abi.encodePacked(sender, id, copyId, isCommission, isSelf, isOnce, isSingle, isRandomHash, isAddress));

        string memory startIndex = '0';
        bytes32 startIndexHashId = keccak256(abi.encodePacked(startIndex, hashId));
            
        if (isSingle && listFields[startIndexHashId].user != address(0)) {
            require(listFields[startIndexHashId].user == msg.sender, "Not owner");
        }

        if (isCommission) {
            payCommission(id);
        }

        string memory index = uintToString(listIndexs[hashId]);
                       
        bytes32 indexHashId = keccak256(abi.encodePacked(index, hashId));
        listFields[indexHashId] = Item({
            index: index,
            user: msg.sender,
            text: escapeQuotes(_text),
            timestamp: block.timestamp
        });
        listIndexs[hashId] += 1;
        listStat++;
    }

    function listRowUpdate(string memory id, string memory copyId, bool isCommission, bool isSelf, bool isOnce, bool isSingle, bool isRandomHash, bool isAddress, string memory index, string memory text) public nonReentrant {
        require(bytes(index).length <= 128, "Index value too much");
        require(bytes(id).length <= 128, "Id value too much");
        require(bytes(copyId).length <= 128, "CopyId value too much");
        require(bytes(text).length <= 5000, "Text value too much");
        require(!isOnce, 'No edittable');

        address sender = address(0);
        if (isSelf) {
            sender = msg.sender;
        }

        string memory _text = text;
        if (isRandomHash) {
            if (bytes(text).length > 0) {
                _text = randomHashString(text);
            } else {
                _text = "";
            }
        }

        if (isAddress) {
            if (bytes(text).length > 0) {
                _text = _a2s(msg.sender);
            } else {
                _text = "";
            }
        }

        bytes32 hashId = keccak256(abi.encodePacked(sender, id, copyId, isCommission, isSelf, isOnce, isSingle, isRandomHash, isAddress));
        bytes32 indexHashId = keccak256(abi.encodePacked(index, hashId));
        
        require(listFields[indexHashId].user == msg.sender, "Not row owner");

        if (isCommission) {
            payCommission(id);
        } 

        uint256 timestamp = listFields[indexHashId].timestamp;
        listFields[indexHashId] = Item({
            index: index,
            user: msg.sender,
            text: escapeQuotes(_text),
            timestamp: timestamp
        });
        listStat++;
    }

    function listRowRead(string memory id, string memory copyId, bool isCommission, bool isSelf, bool isOnce, bool isSingle, bool isRandomHash, bool isAddress, address _address, string memory index) view public returns (string memory) {
        require(bytes(id).length <= 128, "Id value too much");
        require(bytes(copyId).length <= 128, "CopyId value too much");
        require(bytes(index).length <= 128, "Index value too much");
        
        address _sender = _address;
        address sender = address(0);
        if (isSelf) {
            sender = _sender;
        }

        bytes32 hashId = keccak256(abi.encodePacked(sender, id, copyId, isCommission, isSelf, isOnce, isSingle, isRandomHash, isAddress));
        bytes32 indexHashId = keccak256(abi.encodePacked(index, hashId));
        
        Item memory data = listFields[indexHashId];
        return string(
            abi.encodePacked(
                '{',
                    '"index":"', data.index,
                    '","address":"', _a2s(data.user),
                    '","text":"', data.text,
                    '","timestamp":"', _u2s(data.timestamp),
                '"}'
            )
        );
    }

    function listRowsCount(string memory id, string memory copyId, bool isCommission, bool isSelf, bool isOnce, bool isSingle, bool isRandomHash, bool isAddress, address _address) view public returns (uint256) {
        require(bytes(id).length <= 128, "Id value too much");
        require(bytes(copyId).length <= 128, "CopyId value too much");
        
        address _sender = _address;
        address sender = address(0);
        if (isSelf) {
            sender = _sender;
        }

        bytes32 hashId = keccak256(abi.encodePacked(sender, id, copyId, isCommission, isSelf, isOnce, isSingle, isRandomHash, isAddress));
        return listIndexs[hashId];
    }

    ///////////////////////////////////////////////////////////////////////

    function counterWrite(string memory id, string memory copyId, bool isCommission, bool isSelf, bool isOnce, bool isSingle, bool isSwitch) public {
        require(bytes(id).length <= 128, "Id value too much");
        require(bytes(copyId).length <= 128, "CopyId value too much");

        address _sender = msg.sender;
        address sender = address(0);
        if (isSelf) {
            sender = _sender;
        }

        bytes32 hashId = keccak256(abi.encodePacked(sender, id, copyId, isCommission, isSelf, isOnce, isSingle, isSwitch));
        bytes32 hashSender = keccak256(abi.encodePacked(_sender, hashId));

        if (isSingle) {
            require(singles[hashId] == address(0) || singles[hashId] == msg.sender, "Not owner");
        }

        if (isCommission) {
            payCommission(id);
        }

        if (isSingle && singles[hashId] != msg.sender) {
            singles[hashId] = msg.sender;
        }

        if (isSwitch) {
            if (counter[hashSender]) {
                counters[hashId]--;
                counter[hashSender] = false;
            } else {
                counters[hashId]++;
                counter[hashSender] = true;
            }

            counterStat++;
            return;
        }

        if (isOnce) {
            require(!counter[hashSender], "The vote has already been accounted for");

            if (!counter[hashSender]) {
                counters[hashId]++;
                counter[hashSender] = true;
            }
            counterStat++;
            return;
        }

        counters[hashId]++;
        counterStat++;
    }

    function counterRead(string memory id, string memory copyId, bool isCommission, bool isSelf, bool isOnce, bool isSingle, bool isSwitch, address _address) view public returns (string memory) {
        require(bytes(id).length <= 128, "Id value too much");
        require(bytes(copyId).length <= 128, "CopyId value too much");

        address _sender = _address;
        address sender = address(0);
        if (isSelf) {
            sender = _sender;
        }

        bytes32 hashId = keccak256(abi.encodePacked(sender, id, copyId, isCommission, isSelf, isOnce, isSingle, isSwitch));
        bytes32 hashSender = keccak256(abi.encodePacked(_sender, hashId));

        uint256 count = counters[hashId];
        string memory voted = counter[hashSender] ? "true" : "false";

        return string(abi.encodePacked('{"count":', _u2s(count), ',"voted":', voted, '}'));
    }
}