const { ethers, getNamedAccounts, network } = require("hardhat");
const { assert, expect } = require("chai");
const { mockOnThisNetworks } = require("../../helper-hardhat-config");
const fs = require("fs");

const lowSvg =
  "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgd2lkdGg9IjQwMCIgIGhlaWdodD0iNDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgZmlsbD0ieWVsbG93IiByPSI3OCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIzIi8+CiAgPGcgY2xhc3M9ImV5ZXMiPgogICAgPGNpcmNsZSBjeD0iNjEiIGN5PSI4MiIgcj0iMTIiLz4KICAgIDxjaXJjbGUgY3g9IjEyNyIgY3k9IjgyIiByPSIxMiIvPgogIDwvZz4KICA8cGF0aCBkPSJtMTM2LjgxIDExNi41M2MuNjkgMjYuMTctNjQuMTEgNDItODEuNTItLjczIiBzdHlsZT0iZmlsbDpub25lOyBzdHJva2U6IGJsYWNrOyBzdHJva2Utd2lkdGg6IDM7Ii8+Cjwvc3ZnPg==";
const highSvg =
  "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8c3ZnIHdpZHRoPSIxMDI0cHgiIGhlaWdodD0iMTAyNHB4IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGZpbGw9IiMzMzMiIGQ9Ik01MTIgNjRDMjY0LjYgNjQgNjQgMjY0LjYgNjQgNTEyczIwMC42IDQ0OCA0NDggNDQ4IDQ0OC0yMDAuNiA0NDgtNDQ4Uzc1OS40IDY0IDUxMiA2NHptMCA4MjBjLTIwNS40IDAtMzcyLTE2Ni42LTM3Mi0zNzJzMTY2LjYtMzcyIDM3Mi0zNzIgMzcyIDE2Ni42IDM3MiAzNzItMTY2LjYgMzcyLTM3MiAzNzJ6Ii8+CiAgPHBhdGggZmlsbD0iI0U2RTZFNiIgZD0iTTUxMiAxNDBjLTIwNS40IDAtMzcyIDE2Ni42LTM3MiAzNzJzMTY2LjYgMzcyIDM3MiAzNzIgMzcyLTE2Ni42IDM3Mi0zNzItMTY2LjYtMzcyLTM3Mi0zNzJ6TTI4OCA0MjFhNDguMDEgNDguMDEgMCAwIDEgOTYgMCA0OC4wMSA0OC4wMSAwIDAgMS05NiAwem0zNzYgMjcyaC00OC4xYy00LjIgMC03LjgtMy4yLTguMS03LjRDNjA0IDYzNi4xIDU2Mi41IDU5NyA1MTIgNTk3cy05Mi4xIDM5LjEtOTUuOCA4OC42Yy0uMyA0LjItMy45IDcuNC04LjEgNy40SDM2MGE4IDggMCAwIDEtOC04LjRjNC40LTg0LjMgNzQuNS0xNTEuNiAxNjAtMTUxLjZzMTU1LjYgNjcuMyAxNjAgMTUxLjZhOCA4IDAgMCAxLTggOC40em0yNC0yMjRhNDguMDEgNDguMDEgMCAwIDEgMC05NiA0OC4wMSA0OC4wMSAwIDAgMSAwIDk2eiIvPgogIDxwYXRoIGZpbGw9IiMzMzMiIGQ9Ik0yODggNDIxYTQ4IDQ4IDAgMSAwIDk2IDAgNDggNDggMCAxIDAtOTYgMHptMjI0IDExMmMtODUuNSAwLTE1NS42IDY3LjMtMTYwIDE1MS42YTggOCAwIDAgMCA4IDguNGg0OC4xYzQuMiAwIDcuOC0zLjIgOC4xLTcuNCAzLjctNDkuNSA0NS4zLTg4LjYgOTUuOC04OC42czkyIDM5LjEgOTUuOCA4OC42Yy4zIDQuMiAzLjkgNy40IDguMSA3LjRINjY0YTggOCAwIDAgMCA4LTguNEM2NjcuNiA2MDAuMyA1OTcuNSA1MzMgNTEyIDUzM3ptMTI4LTExMmE0OCA0OCAwIDEgMCA5NiAwIDQ4IDQ4IDAgMSAwLTk2IDB6Ii8+Cjwvc3ZnPgo=";

const lowTokenUri =
  "data:application/json;base64,eyJuYW1lIjoiU21pbGUiLCAiZGVzY3JpcHRpb24iOiAiQW4gTkZUIHRoYXQgY2hhbmdlcyBpbWFnZXMgd2hlbiBzd2l0Y2hlZCIsImF0dHJpYnV0ZXMiOiBbeyJ0cmFpdF90eXBlIjogImNvb2xuZXNzIiwgInZhbHVlIjogMTAwfV0gLCJpbWFnZSI6ImRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEhOMlp5QjJhV1YzUW05NFBTSXdJREFnTWpBd0lESXdNQ0lnZDJsa2RHZzlJalF3TUNJZ0lHaGxhV2RvZEQwaU5EQXdJaUI0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lQZ29nSUR4amFYSmpiR1VnWTNnOUlqRXdNQ0lnWTNrOUlqRXdNQ0lnWm1sc2JEMGllV1ZzYkc5M0lpQnlQU0kzT0NJZ2MzUnliMnRsUFNKaWJHRmpheUlnYzNSeWIydGxMWGRwWkhSb1BTSXpJaTgrQ2lBZ1BHY2dZMnhoYzNNOUltVjVaWE1pUGdvZ0lDQWdQR05wY21Oc1pTQmplRDBpTmpFaUlHTjVQU0k0TWlJZ2NqMGlNVElpTHo0S0lDQWdJRHhqYVhKamJHVWdZM2c5SWpFeU55SWdZM2s5SWpneUlpQnlQU0l4TWlJdlBnb2dJRHd2Wno0S0lDQThjR0YwYUNCa1BTSnRNVE0yTGpneElERXhOaTQxTTJNdU5qa2dNall1TVRjdE5qUXVNVEVnTkRJdE9ERXVOVEl0TGpjeklpQnpkSGxzWlQwaVptbHNiRHB1YjI1bE95QnpkSEp2YTJVNklHSnNZV05yT3lCemRISnZhMlV0ZDJsa2RHZzZJRE03SWk4K0Nqd3ZjM1puUGc9PSJ9";

const highTokenUri =
  "data:application/json;base64,eyJuYW1lIjoiU21pbGUiLCAiZGVzY3JpcHRpb24iOiAiQW4gTkZUIHRoYXQgY2hhbmdlcyBpbWFnZXMgd2hlbiBzd2l0Y2hlZCIsImF0dHJpYnV0ZXMiOiBbeyJ0cmFpdF90eXBlIjogImNvb2xuZXNzIiwgInZhbHVlIjogMTAwfV0gLCJpbWFnZSI6ImRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCemRHRnVaR0ZzYjI1bFBTSnVieUkvUGdvOGMzWm5JSGRwWkhSb1BTSXhNREkwY0hnaUlHaGxhV2RvZEQwaU1UQXlOSEI0SWlCMmFXVjNRbTk0UFNJd0lEQWdNVEF5TkNBeE1ESTBJaUI0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lQZ29nSUR4d1lYUm9JR1pwYkd3OUlpTXpNek1pSUdROUlrMDFNVElnTmpSRE1qWTBMallnTmpRZ05qUWdNalkwTGpZZ05qUWdOVEV5Y3pJd01DNDJJRFEwT0NBME5EZ2dORFE0SURRME9DMHlNREF1TmlBME5EZ3RORFE0VXpjMU9TNDBJRFkwSURVeE1pQTJOSHB0TUNBNE1qQmpMVEl3TlM0MElEQXRNemN5TFRFMk5pNDJMVE0zTWkwek56SnpNVFkyTGpZdE16Y3lJRE0zTWkwek56SWdNemN5SURFMk5pNDJJRE0zTWlBek56SXRNVFkyTGpZZ016Y3lMVE0zTWlBek56SjZJaTgrQ2lBZ1BIQmhkR2dnWm1sc2JEMGlJMFUyUlRaRk5pSWdaRDBpVFRVeE1pQXhOREJqTFRJd05TNDBJREF0TXpjeUlERTJOaTQyTFRNM01pQXpOekp6TVRZMkxqWWdNemN5SURNM01pQXpOeklnTXpjeUxURTJOaTQySURNM01pMHpOekl0TVRZMkxqWXRNemN5TFRNM01pMHpOeko2VFRJNE9DQTBNakZoTkRndU1ERWdORGd1TURFZ01DQXdJREVnT1RZZ01DQTBPQzR3TVNBME9DNHdNU0F3SURBZ01TMDVOaUF3ZW0wek56WWdNamN5YUMwME9DNHhZeTAwTGpJZ01DMDNMamd0TXk0eUxUZ3VNUzAzTGpSRE5qQTBJRFl6Tmk0eElEVTJNaTQxSURVNU55QTFNVElnTlRrM2N5MDVNaTR4SURNNUxqRXRPVFV1T0NBNE9DNDJZeTB1TXlBMExqSXRNeTQ1SURjdU5DMDRMakVnTnk0MFNETTJNR0U0SURnZ01DQXdJREV0T0MwNExqUmpOQzQwTFRnMExqTWdOelF1TlMweE5URXVOaUF4TmpBdE1UVXhMalp6TVRVMUxqWWdOamN1TXlBeE5qQWdNVFV4TGpaaE9DQTRJREFnTUNBeExUZ2dPQzQwZW0weU5DMHlNalJoTkRndU1ERWdORGd1TURFZ01DQXdJREVnTUMwNU5pQTBPQzR3TVNBME9DNHdNU0F3SURBZ01TQXdJRGsyZWlJdlBnb2dJRHh3WVhSb0lHWnBiR3c5SWlNek16TWlJR1E5SWsweU9EZ2dOREl4WVRRNElEUTRJREFnTVNBd0lEazJJREFnTkRnZ05EZ2dNQ0F4SURBdE9UWWdNSHB0TWpJMElERXhNbU10T0RVdU5TQXdMVEUxTlM0MklEWTNMak10TVRZd0lERTFNUzQyWVRnZ09DQXdJREFnTUNBNElEZ3VOR2cwT0M0eFl6UXVNaUF3SURjdU9DMHpMaklnT0M0eExUY3VOQ0F6TGpjdE5Ea3VOU0EwTlM0ekxUZzRMallnT1RVdU9DMDRPQzQyY3preUlETTVMakVnT1RVdU9DQTRPQzQyWXk0eklEUXVNaUF6TGprZ055NDBJRGd1TVNBM0xqUklOalkwWVRnZ09DQXdJREFnTUNBNExUZ3VORU0yTmpjdU5pQTJNREF1TXlBMU9UY3VOU0ExTXpNZ05URXlJRFV6TTNwdE1USTRMVEV4TW1FME9DQTBPQ0F3SURFZ01DQTVOaUF3SURRNElEUTRJREFnTVNBd0xUazJJREI2SWk4K0Nqd3ZjM1puUGdvPSJ9";
mockOnThisNetworks.includes(network.name)
  ? describe("SvgNFT", () => {
      let deployer, contract, mockAggregator, svg;
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        contract = await ethers.getContract("SvgNFT", deployer);
        mockAggregator = await ethers.getContract("MockV3Aggregator", deployer);
        svg = fs.readFileSync("./Images/dynamic/frown.svg", "utf8");
      });
      describe("constructor", () => {
        it("Sets price,id and images correctly", async () => {
          const id = await contract.getTokenId();
          assert.equal(id.toString(), "0");
          assert(
            (await contract.getLowSvg()).includes("data:image/svg+xml;base64,")
          );
          assert(
            (await contract.getHighSvg()).includes("data:image/svg+xml;base64,")
          );
          assert.equal(await contract.getPriceFeed(), mockAggregator.address);
        });
      });
      describe("mint", () => {
        it("mints nft and emits event", async () => {
          await contract.mintNft("5");
          const id = await contract.getTokenId();
          const value = await contract.s_tokenIdToHighValue(id.toString());
          assert.equal(id.toString(), "1");
          assert.equal(value.toString(), "5");
          expect(async () => {
            await contract.mintNft("5");
          }).to.emit(contract, "CreatedNFT");
        });
      });

      describe("svgToImageUri", () => {
        it("should set svg to imageURI", async () => {
          const imageURI = await contract.svgToImageUri(svg);
          assert(imageURI.includes("data:image/svg+xml;base64,"));
        });
      });

      describe("tokenURI", () => {
        it("should revert with no token id", async () => {
          expect(async () => {
            await contract.tokenURI();
          }).to.be.revertedWith("Token id doesn't exist");
        });
        it("contains prefixed json format and return high value", async () => {
          await contract.mintNft(ethers.utils.parseEther("100")); //should return frown face
          const id = await contract.getTokenId();
          const tokenUri = await contract.tokenURI(id.toString());
          assert(tokenUri.includes("data:application/json;base64,"));
          assert.equal(tokenUri, lowTokenUri);
        });
      });
    })
  : describe.skip;
