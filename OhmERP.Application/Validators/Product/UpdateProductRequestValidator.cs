using FluentValidation;
using OhmERP.Application.DTOs.Product;

namespace OhmERP.Application.Validators.Product;

public class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequest>
{
    public UpdateProductRequestValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("ID alanı zorunludur.");
        RuleFor(x => x.Name).NotEmpty().WithMessage("Ürün adı boş olamaz.");
        RuleFor(x => x.FirmId).NotEmpty().WithMessage("Firma seçilmelidir.");
        RuleFor(x => x.VoltParameterId).NotEmpty().WithMessage("Volt seçilmelidir.");
        RuleFor(x => x.WattParameterId).NotEmpty().WithMessage("Watt seçilmelidir.");
        RuleFor(x => x.WireId).NotEmpty().WithMessage("Tel seçilmelidir.");
        RuleFor(x => x.SheetId).NotEmpty().WithMessage("Sac seçilmelidir.");
        RuleFor(x => x.GasId).NotEmpty().WithMessage("Kaynak Gazı seçilmelidir.");
        RuleFor(x => x.PinId).NotEmpty().WithMessage("Pim seçilmelidir.");
        RuleFor(x => x.Plug1Id).NotEmpty().WithMessage("1. Tapa seçilmelidir.");
        RuleFor(x => x.Socket1Id).NotEmpty().WithMessage("1. Soket seçilmelidir.");
        
        When(x => x.IsMixedSand, () =>
        {
            RuleFor(x => x.MixedSand1Id).NotEmpty().WithMessage("Karışık kum aktifken 1. Kum seçilmelidir.");
            RuleFor(x => x.MixedSand1Ratio).NotEmpty().WithMessage("Karışık kum aktifken 1. Kum oranı girilmelidir.");
            RuleFor(x => x.MixedSand2Id).NotEmpty().WithMessage("Karışık kum aktifken 2. Kum seçilmelidir.");
            RuleFor(x => x.MixedSand2Ratio).NotEmpty().WithMessage("Karışık kum aktifken 2. Kum oranı girilmelidir.");
        }).Otherwise(() =>
        {
            RuleFor(x => x.SandId).NotEmpty().WithMessage("Karışık kum pasifken Tek Kum seçilmelidir.");
        });

        When(x => x.HasInnerProduct, () =>
        {
            RuleFor(x => x.InnerDetail).NotNull().WithMessage("İç ürün detayları zorunludur.");
            RuleFor(x => x.InnerDetail!.InnerVoltParameterId).NotEmpty().When(x => x.InnerDetail != null).WithMessage("İç ürün: Volt seçilmelidir.");
            RuleFor(x => x.InnerDetail!.InnerWattParameterId).NotEmpty().When(x => x.InnerDetail != null).WithMessage("İç ürün: Watt seçilmelidir.");
            RuleFor(x => x.InnerDetail!.InnerWireId).NotEmpty().When(x => x.InnerDetail != null).WithMessage("İç ürün: Tel seçilmelidir.");
            RuleFor(x => x.InnerDetail!.InnerSheetId).NotEmpty().When(x => x.InnerDetail != null).WithMessage("İç ürün: Sac seçilmelidir.");
            RuleFor(x => x.InnerDetail!.InnerGasId).NotEmpty().When(x => x.InnerDetail != null).WithMessage("İç ürün: Kaynak Gazı seçilmelidir.");
            RuleFor(x => x.InnerDetail!.InnerPlug1Id).NotEmpty().When(x => x.InnerDetail != null).WithMessage("İç ürün: 1. Tapa seçilmelidir.");
            
            When(x => x.InnerDetail != null && x.InnerDetail.InnerIsMixedSand, () =>
            {
                RuleFor(x => x.InnerDetail!.InnerMixedSand1Id).NotEmpty().WithMessage("İç ürün: Karışık kum aktifken 1. Kum seçilmelidir.");
                RuleFor(x => x.InnerDetail!.InnerMixedSand1Ratio).NotEmpty().WithMessage("İç ürün: Karışık kum aktifken 1. Kum oranı girilmelidir.");
                RuleFor(x => x.InnerDetail!.InnerMixedSand2Id).NotEmpty().WithMessage("İç ürün: Karışık kum aktifken 2. Kum seçilmelidir.");
                RuleFor(x => x.InnerDetail!.InnerMixedSand2Ratio).NotEmpty().WithMessage("İç ürün: Karışık kum aktifken 2. Kum oranı girilmelidir.");
            }).Otherwise(() =>
            {
                RuleFor(x => x.InnerDetail!.InnerSandId).NotEmpty().When(x => x.InnerDetail != null && !x.InnerDetail.InnerIsMixedSand).WithMessage("İç ürün: Karışık kum pasifken Tek Kum seçilmelidir.");
            });
        });

        RuleFor(x => x.Images.Count).LessThanOrEqualTo(3).WithMessage("En fazla 3 adet resim yüklenebilir.");
    }
}
