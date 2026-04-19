namespace OhmERP.Domain.Enums;

public enum ItemType
{
    RawMaterial = 1,    // Hammadde (Tel, Sac, Kum, Pim vb.)
    SemiFinished = 2,   // Yarı Mamul (Çekilmiş Boru vb.)
    FinishedGood = 3,   // Mamul (Bitmiş Rezistans - Satışa Hazır)
    Consumable = 4      // Sarf Malzeme (Kaynak Gazı, Paketleme Bandı vb.)
}